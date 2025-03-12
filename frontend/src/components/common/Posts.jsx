import Post from "./Post";
import PostSkeleton from "../skeletons/PostSkeleton";
import { POSTS } from "../../utils/db/dummy";
import { useUser } from "../../context/UserContextProvider";
import { useState, useEffect } from "react";

const Posts = ({ feedType, username, userId }) => {
  const { isLoading: isUserLoading } = useUser();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getPostEndpoint = () => {
    switch (feedType) {
      case "forYou":
        return "/api/posts/all";
      case "following":
        return "/api/posts/following";
      case "posts":
        return `/api/posts/user/${username}`;
      case "likes":
        return `/api/posts/likes/${userId}`;
      default:
        return "/api/posts/all";
    }
  };

  const POST_ENDPOINT = getPostEndpoint();

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);

      try {
        const response = await axios.get(POST_ENDPOINT);
        setPosts(response.data); // Updating the posts state here
      } catch (err) {
        console.error(err.response?.data?.error || "Failed to load posts");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [feedType, username, userId]);

  if (isUserLoading) {
    return <p className="text-center my-4">Loading user...</p>;
  }
  return (
    <>
      {isLoading && (
        <div className="flex flex-col justify-center">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      )}

      {!isLoading && posts?.length === 0 && (
        <p className="text-center my-4">No posts in this tab. Switch 👻</p>
      )}
      {!isLoading && posts.length > 0 && (
        <div>
          {posts.map((post) => (
            <Post key={post._id} post={post} />
          ))}
        </div>
      )}
    </>
  );
};
export default Posts;
