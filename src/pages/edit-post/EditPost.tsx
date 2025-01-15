import {
  FunctionComponent,
  useState,
  useEffect,
  ChangeEvent,
  useRef,
} from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import PostService, { PostCreationData } from "@/services/PostService";
import FileService from "@/services/FileService";
import "@/pages/edit-post/EditPost.css";
import Loader from "@/components/loader/Loader";
import axios from "axios";

interface EditablePostProps {
  content: string;
  file_id: number | null;
  user_id: number | null;
  parent_id?: number;
}

const initialEditablePost: EditablePostProps = {
  content: "",
  file_id: null,
  user_id: null,
  parent_id: undefined,
};

const EditPost: FunctionComponent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [editablePost, setEditablePost] =
    useState<EditablePostProps>(initialEditablePost);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const token = localStorage.getItem("authToken");
  const currentUserId = token
    ? JSON.parse(atob(token.split(".")[1])).sub
    : null;

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const parentId = urlParams.get("parentId");

    const fetchParentPost = async () => {
      try {
        setIsLoading(true);

        if (parentId) {
          setEditablePost((prevState) => ({
            ...prevState,
            parent_id: Number(parentId),
            content: prevState.content.includes("#{reply_to}#")
              ? prevState.content
              : `#{reply_to}# ${prevState.content}`,
          }));
        }

        if (currentUserId) {
          setEditablePost((prevState) => ({
            ...prevState,
            user_id: Number(currentUserId),
          }));
        }
      } catch {
        setGlobalError("Failed to fetch parent post. Please try again");
      } finally {
        setIsLoading(false);
      }
    };

    fetchParentPost();

    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [location.search, currentUserId, filePreview]);

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    setEditablePost({ ...editablePost, content: value });
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const mimeType = file.type;

    if (filePreview) URL.revokeObjectURL(filePreview);

    setGlobalError(null);
    setFilePreview(null);
    setFileType(null);
    setUploading(true);

    try {
      const uploadedFile = await FileService.uploadFile(file);
      setEditablePost({ ...editablePost, file_id: uploadedFile.id });

      const fileUrl = URL.createObjectURL(file);
      setFilePreview(fileUrl);

      if (mimeType.startsWith("image/")) {
        setFileType("image");
      } else if (mimeType.startsWith("video/")) {
        setFileType("video");
      } else {
        setFileType(null);
        setGlobalError(
          "Unsupported file type. Please upload an image or video"
        );
      }
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response &&
        error.response.status !== 500
      )
        setGlobalError(error.response.data.message);
      else setGlobalError("Failed to upload file, please try again later");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveClick = async () => {
    setGlobalError(null);

    try {
      const postData: PostCreationData = {
        content: editablePost.content,
        file_id: editablePost.file_id || undefined,
        user_id: editablePost.user_id!,
        parent_id: editablePost.parent_id,
      };

      const data = await PostService.createPost(postData);
      if (data) setGlobalError(data.message);
      else navigate("/");
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response &&
        error.response.status !== 500
      )
        setGlobalError(error.response.data.message);
      else setGlobalError("Failed to create post, please try again later");
    }
  };

  const handleCancelClick = () => {
    navigate("/");
  };

  const applyFormatting = (tag: string) => {
    setEditablePost((prevState) => ({
      ...prevState,
      content: prevState.content + `<${tag}></${tag}>`,
    }));
  };

  const insertExpression = (expression: string) => {
    setEditablePost((prevState) => ({
      ...prevState,
      content: prevState.content + expression,
    }));
  };

  const renderFilePreview = () => {
    if (!filePreview || !fileType) return null;

    if (fileType === "image") {
      return (
        <img src={filePreview} alt="File Preview" className="media-preview" />
      );
    } else if (fileType === "video") {
      return (
        <video controls className="media-preview">
          <source src={filePreview} />
        </video>
      );
    }

    return null;
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="edit-post-page">
      <h1>{id ? "Reply to Post" : "Create a Post"}</h1>
      <div className="toolbar">
        <button onClick={() => applyFormatting("b")}>Bold</button>
        <button onClick={() => applyFormatting("i")}>Italic</button>
        <button onClick={() => applyFormatting("u")}>Underline</button>
        <button
          onClick={() => insertExpression('<a href="https://example.com"></a>')}
        >
          Link
        </button>
        <select
          onChange={(e) => applyFormatting(e.target.value)}
          defaultValue=""
        >
          <option value="" disabled>
            Heading
          </option>
          <option value="h1">H1</option>
          <option value="h2">H2</option>
          <option value="h3">H3</option>
          <option value="h4">H4</option>
          <option value="h5">H5</option>
          <option value="h6">H6</option>
        </select>
        <select
          onChange={(e) => insertExpression(e.target.value)}
          defaultValue=""
        >
          <option value="" disabled>
            Insert Dynamic Expression
          </option>
          <option value="#{username}#">Username</option>
          <option value="#{current_date}#">Current Date</option>
        </select>
      </div>
      <div className="form-group">
        <label>Content</label>
        <textarea
          value={editablePost.content}
          onChange={handleInputChange}
          placeholder="Write your post content here..."
        />
      </div>
      <div className="form-group">
        <label>File</label>
        <div className="file-upload-container">
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            disabled={uploading}
          />
        </div>
      </div>
      {renderFilePreview() && (
        <div className="file-preview-container">{renderFilePreview()}</div>
      )}
      {globalError && <div className="error">{globalError}</div>}
      <div className="edit-post-buttons">
        <button className="cancel-button" onClick={handleCancelClick}>
          Cancel
        </button>
        <button className="save-button" onClick={handleSaveClick}>
          Save
        </button>
      </div>
    </div>
  );
};

export default EditPost;
