import { FunctionComponent } from "react";
import { Routes, Route } from "react-router-dom";
import {
  PrivateLayout,
  Home,
  Post,
  PostEdit,
  Profile,
  PageNotFound,
} from "@/pages";

const PrivateRouter: FunctionComponent = () => {
  return (
    <Routes>
      <Route element={<PrivateLayout />}>
        <Route index element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/post/:id" element={<Post />} />
        <Route path="/post/edit" element={<PostEdit />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};

export default PrivateRouter;
