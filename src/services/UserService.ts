import axiosInstance from "@/services/axiosConfig";

interface ChangeProfilData {
  firstname: string;
  lastname: string;
  username: string;
  birthday: string;
  gender: string;
  nationality: string;
  picture_id: number | null;
  bio: string;
}

interface ChangePasswordData {
  old_password: string;
  new_password: string;
}

const UserService = {
  getOptions: async () => {
    const response = await axiosInstance.get("/options");
    return response.data;
  },

  getFlag: async () => {
    const response = await axiosInstance.get("/admin/flag");
    return response.data;
  },

  getProfile: async (id: string) => {
    const response = await axiosInstance.get(`/profiles/${id}`);
    return response.data;
  },

  updateProfile: async (
    id: string | undefined,
    profileData: ChangeProfilData
  ) => {
    const response = await axiosInstance.put(`/profiles/${id}`, profileData);
    return response.data;
  },

  changePassword: async (id: string, passwordData: ChangePasswordData) => {
    await axiosInstance.put(`/profiles/${id}/password`, passwordData);
  },

  deleteAccount: async (id: string) => {
    await axiosInstance.delete(`/profiles/${id}`);
  },
};

export default UserService;
