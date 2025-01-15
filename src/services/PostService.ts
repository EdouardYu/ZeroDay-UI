import axiosInstance from "@/services/axiosConfig";

export interface PostCreationData {
  content?: string;
  file_id?: number;
  user_id: number;
  parent_id?: number;
}

export interface PostModificationData {
  content?: string;
  fileId?: number;
}

const PostService = {
  getAllPosts: async (page: number, size: number) => {
    const response = await axiosInstance.get("/posts", {
      params: { page, size },
    });
    return response.data;
  },

  getPostById: async (id: string) => {
    const response = await axiosInstance.get(`/posts/${id}`);
    return response.data;
  },

  createPost: async (post: PostCreationData) => {
    const response = await axiosInstance.post("/posts", post);
    return response.data;
  },

  updatePost: async (id: string, post: PostModificationData) => {
    const response = await axiosInstance.put(`/posts/${id}`, post);
    return response.data;
  },

  deletePost: async (id: string) => {
    await axiosInstance.delete(`/posts/${id}`);
  },

  getLinkPreview: async (url: string) => {
    const response = await axiosInstance.get("/posts/link/preview", {
      params: { url },
    });
    return response.data;
  },
};

export default PostService;
