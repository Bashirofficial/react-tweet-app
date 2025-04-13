import { useState, useEffect } from "react";

import Posts from "../../components/common/Posts";
import CreatePost from "./CreatePost";
import { useUser } from "../../context/UserContextProvider";
const HomePage = () => {
  const { user } = useUser();
  const [feedType, setFeedType] = useState("forYou");
  const [posts, setPosts] = useState([]);

  // Callback function to update posts after creating a post
  const handlePostCreated = (newPost) => {
    if (newPost && newPost._id) {
      console.log("New Post Created:", newPost);
      setPosts((prevPosts) => [newPost, ...prevPosts]); // Add new post to the top of the feed
    } else {
      console.error("Invalid post data:", newPost);
    }
  };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(`/api/v1/posts/all`, {
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
        console.log("Fetched posts:", result.data); // Log fetched data
        setPosts(result.data); // Update the state with fetched posts
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };

    fetchPosts(); // Call the fetch function when the component mounts
  }, []);

  return (
    <>
      <div className="flex-[4_4_0] mr-auto border-r border-gray-700 min-h-screen">
        {/* Header */}
        <div className="flex w-full border-b border-gray-700">
          <div
            className={
              "flex justify-center flex-1 p-3 hover:bg-secondary transition duration-300 cursor-pointer relative"
            }
            onClick={() => setFeedType("forYou")}
          >
            For you
            {feedType === "forYou" && (
              <div className="absolute bottom-0 w-10  h-1 rounded-full bg-primary"></div>
            )}
          </div>
          <div
            className="flex justify-center flex-1 p-3 hover:bg-secondary transition duration-300 cursor-pointer relative"
            onClick={() => setFeedType("following")}
          >
            Following
            {feedType === "following" && (
              <div className="absolute bottom-0 w-10  h-1 rounded-full bg-primary"></div>
            )}
          </div>
        </div>

        {/*  CREATE POST INPUT */}
        <CreatePost onPostCreated={handlePostCreated} />

        {/* POSTS */}
        <Posts
          feedType={feedType}
          username={user?.username}
          userId={user?._id}
          posts={posts}
        />
      </div>
    </>
  );
};
export default HomePage;
