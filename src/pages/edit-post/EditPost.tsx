import {
  FunctionComponent,
  useState,
  useEffect,
  ChangeEvent,
  useRef,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import PostService, { PostCreationData } from "@/services/PostService";
import FileService from "@/services/FileService";
import "@/pages/edit-post/EditPost.css";
import Loader from "@/components/loader/Loader";

interface EditablePostProps {
  content: string;
  file_id: number | null;
  user_id: number;
  parent_id?: number;
}

const initialEditablePost: EditablePostProps = {
  content: "",
  file_id: null,
  user_id: 0, // This will be set dynamically
  parent_id: undefined,
};

const EditPost: FunctionComponent = () => {
  const { id } = useParams<{ id: string }>(); // Parent post ID from URL
  const navigate = useNavigate();
  const [editablePost, setEditablePost] =
    useState<EditablePostProps>(initialEditablePost);
  const [postImage, setPostImage] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const token = localStorage.getItem("authToken");
  const currentUserId = token
    ? JSON.parse(atob(token.split(".")[1])).sub
    : null;

  useEffect(() => {
    const fetchParentPost = async () => {
      try {
        setIsLoading(true);

        if (id) {
          const parentPost = await PostService.getPostById(Number(id));
          setEditablePost((prevState) => ({
            ...prevState,
            parent_id: parentPost.id,
          }));
        }

        if (currentUserId) {
          setEditablePost((prevState) => ({
            ...prevState,
            user_id: Number(currentUserId),
          }));
        }
      } catch {
        setGlobalError("Failed to fetch parent post. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchParentPost();
  }, [id, currentUserId]);

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    setEditablePost({ ...editablePost, content: value });
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setUploading(true);
    try {
      const uploadedFile = await FileService.uploadFile(file);
      setEditablePost({ ...editablePost, file_id: uploadedFile.id });

      // Preview the uploaded file
      const imageUrl = URL.createObjectURL(file);
      setPostImage(imageUrl);
    } catch {
      setGlobalError("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const validatePost = () => {
    const newErrors: { [key: string]: string } = {};

    if (!editablePost.content || editablePost.content.trim().length === 0) {
      newErrors.content = "Content is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveClick = async () => {
    setGlobalError(null);

    if (!validatePost()) return;

    try {
      const postData: PostCreationData = {
        content: editablePost.content,
        fileId: editablePost.file_id || undefined,
        userId: editablePost.user_id,
        parentId: editablePost.parent_id,
      };

      await PostService.createPost(postData);
      navigate("/"); // Redirect to the homepage after creating/updating the post
    } catch {
      setGlobalError("Failed to save post. Please try again.");
    }
  };

  const handleCancelClick = () => {
    navigate("/");
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="edit-post-page">
      <h1>{id ? "Reply to Post" : "Create a Post"}</h1>
      <div className="form-group">
        <label>Content</label>
        <textarea
          value={editablePost.content}
          onChange={handleInputChange}
          placeholder="Write your post content here..."
        />
        {errors.content && <span className="error">{errors.content}</span>}
      </div>
      <div className="form-group">
        <label>File</label>
        <div className="file-upload-container">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            disabled={uploading}
          />
        </div>
        {postImage && <img src={postImage} alt="Post Media" />}
      </div>
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
