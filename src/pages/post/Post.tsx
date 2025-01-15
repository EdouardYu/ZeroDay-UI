import { FunctionComponent, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PostService, FileService } from "@/services";
import Loader from "@/components/loader/Loader";
import "@/pages/post/Post.css";
import { toCapitalizedWords } from "@/helpers/StringHelper";

interface UserData {
  id: number;
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

const Post: FunctionComponent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);

  const blobUrls: string[] = [];

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
    const fetchPost = async () => {
      try {
        setLoading(true);

        const postData = await PostService.getPostById(id!);

        const userPictureBlob = postData.user.picture_url
          ? await FileService.getFile(postData.user.picture_url)
          : null;
        const userPictureUrl = userPictureBlob
          ? URL.createObjectURL(userPictureBlob)
          : null;

        if (userPictureUrl) blobUrls.push(userPictureUrl);

        const postFileBlob = postData.file_url
          ? await FileService.getFile(postData.file_url)
          : null;
        const postFileUrl = postFileBlob
          ? URL.createObjectURL(postFileBlob)
          : null;

        if (postFileUrl) blobUrls.push(postFileUrl);

        const postFileType = postData.file_url?.includes("images")
          ? "image"
          : postData.file_url?.includes("videos")
          ? "video"
          : null;

        const postLinkPreview = await fetchLinkPreview(postData.content);

        const parentPictureBlob = postData.parent?.user.picture_url
          ? await FileService.getFile(postData.parent.user.picture_url)
          : null;
        const parentPictureUrl = parentPictureBlob
          ? URL.createObjectURL(parentPictureBlob)
          : null;

        if (parentPictureUrl) blobUrls.push(parentPictureUrl);

        const parentFileBlob = postData.parent?.file_url
          ? await FileService.getFile(postData.parent.file_url)
          : null;
        const parentFileUrl = parentFileBlob
          ? URL.createObjectURL(parentFileBlob)
          : null;

        if (parentFileUrl) blobUrls.push(parentFileUrl);

        const parentFileType = postData.parent?.file_url?.includes("images")
          ? "image"
          : postData.parent?.file_url?.includes("videos")
          ? "video"
          : null;

        const parentLinkPreview = postData.parent
          ? await fetchLinkPreview(postData.parent.content)
          : null;

        setPost({
          ...postData,
          user: {
            ...postData.user,
            picture_url: userPictureUrl,
          },
          file_url: postFileUrl,
          file_type: postFileType,
          link_preview: postLinkPreview,
          parent: postData.parent
            ? {
                ...postData.parent,
                user: {
                  ...postData.parent.user,
                  picture_url: parentPictureUrl,
                },
                file_url: parentFileUrl,
                file_type: parentFileType,
                link_preview: parentLinkPreview,
              }
            : undefined,
        });

        const token = localStorage.getItem("authToken");
        if (token) {
          const payload = JSON.parse(atob(token.split(".")[1]));
          setCurrentUserRole(payload.role);
          setCurrentUserId(payload.sub);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPost();

    return () => {
      blobUrls.forEach((url) => URL.revokeObjectURL(url));
      blobUrls.length = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleReply = () => {
    navigate(`/post/edit?parentId=${post?.id}`);
  };

  const handleModify = () => {
    navigate(`/post/edit?id=${post?.id}`);
  };

  const handleDelete = async () => {
    try {
      if (!post) return;
      await PostService.deletePost(post.id.toString());
      navigate("/");
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const renderHTMLContent = (html: string) => (
    <div dangerouslySetInnerHTML={{ __html: html }} />
  );

  const renderLinkPreview = (preview: LinkPreviewData | null) => {
    if (!preview || !preview.url) return null;

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
            onClick={() => navigate(`/profile/${parent.user.id}`)}
            style={{ cursor: "pointer" }}
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

  const renderMedia = (
    fileUrl: string | null,
    fileType: string | undefined
  ) => {
    if (!fileUrl || !fileType) return null;

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

  const canModify =
    post?.user.id == currentUserId || currentUserRole === "ADMINISTRATOR";

  if (loading) {
    return <Loader />;
  }

  if (!post) {
    return <p>Post not found.</p>;
  }

  return (
    <div className="post-page">
      <div className="post">
        <div className="post-header">
          <img
            src={post.user.picture_url}
            alt={post.user.username}
            className="user-avatar"
            onClick={() => navigate(`/profile/${post.user.id}`)}
            style={{ cursor: "pointer" }}
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
      <div className="post-actions">
        <button className="reply-button" onClick={handleReply}>
          Reply
        </button>
        {canModify && (
          <>
            <button className="modify-button" onClick={handleModify}>
              Modify
            </button>
            <button
              className="delete-button"
              onClick={() => setShowDeletePopup(true)}
            >
              Delete
            </button>
          </>
        )}
      </div>
      {showDeletePopup && (
        <div className="popup">
          <div className="popup-content">
            <h3>Are you sure you want to delete this post?</h3>
            <div className="popup-buttons">
              <button
                className="close-button"
                onClick={() => setShowDeletePopup(false)}
              >
                Cancel
              </button>
              <button className="delete-confirm-button" onClick={handleDelete}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Post;
