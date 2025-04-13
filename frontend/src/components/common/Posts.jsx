import Post from "./Post";
import PostSkeleton from "../skeletons/PostSkeleton";
//import { POSTS } from "../../utils/db/dummy";
import { useUser } from "../../context/UserContextProvider";
import { useState, useEffect } from "react";

const Posts = ({ feedType, username, userId, posts }) => {
  //const { isLoading: isUserLoading } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [fetchedPosts, setFetchedPosts] = useState([]);

  const getPostEndpoint = () => {
    switch (feedType) {
      case "forYou":
        return "/api/v1/posts/all";
      case "following":
        return "/api/v1/posts/following";
      case "posts":
        return `/api/v1/posts/user/${username}`;
      case "likes":
        return `/api/v1/posts/likes/${userId}`;
      default:
        return "/api/v1/posts/all";
    }
  };

  const POST_ENDPOINT = getPostEndpoint();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        if (posts.length === 0) {
          const res = await fetch(POST_ENDPOINT, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });

          if (!res.ok) {
            throw new Error("Failed to load posts");
          }

          const result = await res.json();
          //console.log("Posts fetched:", result);
          setFetchedPosts(result.data);
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [feedType]);

  {
    /*
    if (isUserLoading) {
      return <p className="text-center my-4">Loading user...</p>;
    }
  */
  }
  //const displayPosts = posts.filter((post) => post && post._id);
  //const displayPosts = posts?.length > 0 ? posts : fetchedPosts;
  const displayPosts = (
    posts && posts.length > 0 ? posts : fetchedPosts
  ).filter((post) => post && post._id);
  return (
    <>
      {isLoading && (
        <div className="flex flex-col justify-center">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      )}

      {!isLoading && displayPosts.length === 0 && (
        <p className="text-center my-4">No posts in this tab. Switch 👻</p>
      )}
      {!isLoading && displayPosts.length > 0 && (
        <div>
          {displayPosts.map(
            (post) => post && post._id && <Post key={post._id} post={post} />
          )}
        </div>
      )}
    </>
  );
};
export default Posts;
