import axiosInstance from "@/services/axiosConfig";

interface SignUpFormData {
  email: string;
  password: string;
  firstname: string;
  lastname: string;
  birthday: string;
  gender: string;
  nationality: string;
}

interface ActivationFormData {
  email: string;
  code: string;
}

interface ResetPasswordFormData {
  email: string;
  password: string;
  code: string;
}

interface SignInFormData {
  email: string;
  password: string;
}

const AuthService = {
  signup: async (formData: SignUpFormData) => {
    await axiosInstance.post("/signup", formData);
  },

  activate: async (formData: ActivationFormData) => {
    await axiosInstance.post("/activate", formData);
  },

  resendActivationCode: async (email: string) => {
    await axiosInstance.post("/activate/new", { email });
  },

  signin: async (formData: SignInFormData) => {
    const response = await axiosInstance.post("/signin", formData);
    return response.data;
  },

  sendResetPasswordEmail: async (email: string) => {
    await axiosInstance.post("/password/reset", { email });
  },

  resetPassword: async (formData: ResetPasswordFormData) => {
    await axiosInstance.post("/password/new", formData);
  },

  signout: async () => {
    await axiosInstance.post("/signout");
  },
};

export default AuthService;
