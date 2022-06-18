import { DarkContainer, PostFeed, StyledButton, StyledText } from "components";
import PostCard from "components/PostCard";
import { PAGINATE_LIMIT } from "consts";
import { PageRoute } from "enums";
import { usePaginatePosts } from "hooks";
import { mongoConnection } from "lib/server";
import React from "react";
import { IPost } from "types";
import { postDocToObj } from "utils";

interface IHomeProps {
  initPosts: IPost[];
  cursor: string;
}

export async function getServerSideProps({ res }) {
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=30, stale-while-revalidate=90"
  );

  const { Post } = await mongoConnection();
  const postQuery = await Post.find({ isPrivate: false })
    .sort({ createdAt: -1 })
    .limit(PAGINATE_LIMIT)
    .populate("user", "-createdAt -updatedAt -email -password -posts")
    .lean();
  const initPosts = postQuery.map((post) => postDocToObj(post));

  return {
    props: { initPosts },
  };
}

const Home: React.FC = ({ initPosts }: IHomeProps) => {
  const { posts, limitReached, loadMore } = usePaginatePosts(
    true,
    true,
    initPosts
  );

  return (
    <main>
      <section className="header">
        <DarkContainer>
          <StyledText text="Public Posts" variant="h3" />
        </DarkContainer>
      </section>
      <PostFeed>
        {posts.map((post, index) => (
          <PostCard key={index} post={post} />
        ))}
      </PostFeed>
      <br />
      {!limitReached && <StyledButton label="Load more" onClick={loadMore} />}
    </main>
  );
};

export default Home;
