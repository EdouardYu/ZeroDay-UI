import axiosInstance from "@/services/axiosConfig";

const FileService = {
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axiosInstance.post("/file", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  uploadProfilePicture: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axiosInstance.post("/file/profile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  getFile: async (picture_url: string) => {
    const response = await axiosInstance.get(`/file/${picture_url}`, {
      responseType: "blob",
    });
    return response.data;
  },

  getProfilePicture: async (id: string) => {
    const response = await axiosInstance.get(`/file/profile/${id}`, {
      responseType: "blob",
    });
    return response.data;
  },
};

export default FileService;
