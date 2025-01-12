import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PostService from "@/services/PostService";
import FileService from "@/services/FileService";
import "@/pages/home/Home.css";
import Loader from "@/components/loader/Loader";
import { toCapitalizedWords } from "@/helpers/StringHelper";

interface UserData {
  username: string;
  picture_url: string;
  role: string;
}

interface ParentData {
  user: UserData;
  content: string;
  file_url?: string;
  file_type?: string;
  link_preview?: LinkPreviewData;
}

interface PostData {
  id: number;
  user: UserData;
  parent?: ParentData;
  content: string;
  file_url?: string;
  file_type?: string;
  link_preview?: LinkPreviewData;
  last_action: string;
  instant: string;
}

interface LinkPreviewData {
  title: string;
  description: string;
  image: string;
  url: string;
}

const Home = () => {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const pageSize = 20;

  const navigate = useNavigate();

  const fetchLinkPreview = async (
    html: string
  ): Promise<LinkPreviewData | null> => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const firstLink = doc.querySelector("a")?.getAttribute("href");

    if (!firstLink) return null;

    try {
      const previewData = await PostService.getLinkPreview(firstLink);
      return { ...previewData, url: firstLink };
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const response = await PostService.getAllPosts(
          currentPage - 1,
          pageSize
        );

        const postsWithFileUrls = await Promise.all(
          response.content.map(async (post: PostData) => {
            const userPictureBlob = post.user.picture_url
              ? await FileService.getFile(post.user.picture_url)
              : null;
            const userPictureUrl = userPictureBlob
              ? URL.createObjectURL(userPictureBlob)
              : null;

            const isImage = post.file_url?.includes("images") ?? false;
            const isVideo = post.file_url?.includes("videos") ?? false;

            const postFileBlob = post.file_url
              ? await FileService.getFile(post.file_url)
              : null;
            const postFileUrl = postFileBlob
              ? URL.createObjectURL(postFileBlob)
              : null;

            const postLinkPreview = await fetchLinkPreview(post.content);

            const parentPictureBlob = post.parent?.user.picture_url
              ? await FileService.getFile(post.parent.user.picture_url)
              : null;
            const parentPictureUrl = parentPictureBlob
              ? URL.createObjectURL(parentPictureBlob)
              : null;

            const parentFileBlob = post.parent?.file_url
              ? await FileService.getFile(post.parent.file_url)
              : null;
            const parentFileUrl = parentFileBlob
              ? URL.createObjectURL(parentFileBlob)
              : null;

            const parentLinkPreview = post.parent
              ? await fetchLinkPreview(post.parent.content)
              : null;

            return {
              ...post,
              user: {
                ...post.user,
                picture_url: userPictureUrl,
              },
              file_url: postFileUrl,
              file_type: isImage ? "image" : isVideo ? "video" : null,
              link_preview: postLinkPreview,
              parent: post.parent
                ? {
                    ...post.parent,
                    user: {
                      ...post.parent.user,
                      picture_url: parentPictureUrl,
                    },
                    file_url: parentFileUrl,
                    file_type: post.parent.file_url?.includes("images")
                      ? "image"
                      : post.parent.file_url?.includes("videos")
                      ? "video"
                      : null,
                    link_preview: parentLinkPreview,
                  }
                : null,
            };
          })
        );

        setPosts(postsWithFileUrls);
        setTotalPages(response.page.totalPages);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();

    return () => {
      posts.forEach((post) => {
        if (post.user.picture_url) URL.revokeObjectURL(post.user.picture_url);
        if (post.file_url) URL.revokeObjectURL(post.file_url);
        if (post.parent?.file_url) URL.revokeObjectURL(post.parent.file_url);
        if (post.parent?.user.picture_url)
          URL.revokeObjectURL(post.parent.user.picture_url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const previousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const renderHTMLContent = (html: string) => {
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };

  const renderLinkPreview = (preview: LinkPreviewData | null) => {
    if (!preview) return null;

    return (
      <a href={preview.url} target="_blank" rel="noopener noreferrer">
        <div className="link-preview">
          {preview.image && (
            <img
              src={preview.image}
              alt="Preview"
              className="preview-image"
              style={{ width: "80px", height: "80px", marginRight: "10px" }}
            />
          )}
          <div className="preview-text">
            <h4>{preview.title}</h4>
            {preview.description && <p>{preview.description}</p>}
          </div>
        </div>
      </a>
    );
  };

  const renderParentPost = (parent: ParentData) => {
    return (
      <div className="parent-post">
        <div className="parent-header">
          <img
            src={parent.user.picture_url}
            alt={parent.user.username}
            className="user-avatar"
          />
          <div className="user-info">
            <strong>{parent.user.username}</strong>
            <small>{parent.user.role}</small>
          </div>
        </div>
        {renderHTMLContent(parent.content)}
        {renderLinkPreview(parent.link_preview!)}
        {parent.file_url && renderMedia(parent.file_url, parent.file_type)}
      </div>
    );
  };

  const renderPost = (post: PostData) => {
    const handlePostClick = () => {
      navigate(`/post/${post.id}`);
    };

    return (
      <div
        className="post"
        key={post.id}
        onClick={handlePostClick}
        style={{ cursor: "pointer" }}
      >
        <div className="post-header">
          <img
            src={post.user.picture_url}
            alt={post.user.username}
            className="user-avatar"
          />
          <div className="user-info">
            <strong>{post.user.username}</strong>
            <small>{post.user.role}</small>
          </div>
        </div>
        {post.parent && renderParentPost(post.parent)}
        {renderHTMLContent(post.content)}
        {renderLinkPreview(post.link_preview!)}
        {post.file_url && renderMedia(post.file_url, post.file_type)}
        <div className="post-footer">
          <span className="post-date">
            {toCapitalizedWords(post.last_action)} on{" "}
            {new Date(post.instant).toLocaleString()}
          </span>
        </div>
      </div>
    );
  };

  const renderMedia = (
    fileUrl: string | null,
    fileType: string | undefined
  ) => {
    if (!fileUrl || !fileType) {
      return null;
    }

    if (fileType === "image") {
      return (
        <div className="media">
          <img src={fileUrl} alt="Media" />
        </div>
      );
    } else if (fileType === "video") {
      return (
        <div className="media">
          <video controls>
            <source src={fileUrl} />
          </video>
        </div>
      );
    }

    return <p>Unsupported file type</p>;
  };

  const renderPagination = () => {
    if (loading || totalPages <= 1) {
      return null;
    }

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          className={`pagination-button ${i === currentPage ? "active" : ""}`}
          onClick={() => setCurrentPage(i)}
          disabled={i === currentPage}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="pagination">
        <button onClick={previousPage} disabled={currentPage === 1}>
          Previous
        </button>
        {pages}
        <button onClick={nextPage} disabled={currentPage === totalPages}>
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="home">
      <h1>Posts</h1>
      {loading ? (
        <Loader />
      ) : posts.length > 0 ? (
        posts.map((post) => renderPost(post))
      ) : (
        <p>No posts available.</p>
      )}
      {renderPagination()}
    </div>
  );
};

export default Home;
