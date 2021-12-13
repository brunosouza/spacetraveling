import { GetStaticProps } from 'next';
import Head from 'next/Head';
import Link from 'next/link';

import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { RichText } from 'prismic-dom';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FiUser, FiCalendar } from 'react-icons/fi';
import { useEffect, useState } from 'react';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

interface PostProps {
  posts: Post[];
}

export default function Home({ postsPagination }: HomeProps) {
  let { results, next_page } = postsPagination;
  const [posts, setPosts] = useState<Post[]>([]);
  const [hasNextPage, setHasNextPage] = useState('');

  useEffect(() => {
    setPosts(results);
    setHasNextPage(next_page);
  }, [results, next_page]);

  const loadMorePosts = async () => {
    try {
      const result = await fetch(next_page);
      const newPage = await result.json();
      newPage.results.map(newPost => {
        const newPosts: Post = {
          uid: newPost.uid,
          first_publication_date: newPost.first_publication_date,
          data: {
            title: newPost.data.title,
            subtitle: newPost.data.subtitle,
            author: newPost.data.author,
          },
        };
        setPosts([...results, newPosts]);
      });
      setHasNextPage(newPage.next_page);
    } catch (error) {
      console.log(`Error: ${error}`);
    }
  };

  return (
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>
      <main className={styles.container}>
        <div className={`${commonStyles.contentWrapper} ${styles.posts}`}>
          {posts.map(post => (
            <Link href={`post/${post.uid}`} key={post.uid}>
              <a>
                <h1>{post.data.title}</h1>
                <h2>{post.data.subtitle}</h2>
                <time>
                  <FiCalendar />
                  {format(
                    new Date(post.first_publication_date),
                    'dd MMM yyyy',
                    {
                      locale: ptBR,
                    }
                  )}
                </time>
                <span>
                  <FiUser />
                  {post.data.author}
                </span>
              </a>
            </Link>
          ))}
          {!!hasNextPage && (
            <div onClick={loadMorePosts} className={styles.loadMore}>
              Carregar mais posts
            </div>
          )}
        </div>
      </main>
    </>
  );
  // TODO
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    { fetch: ['post.title', 'post.content'], pageSize: 2 }
  );

  const next_page = postsResponse.next_page;

  const results = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });
  // console.log(!!nextPage);
  // console.log(JSON.stringify(postsResponse, null, 2));

  return {
    props: { postsPagination: { results, next_page } },
  };
  // TODO
};
