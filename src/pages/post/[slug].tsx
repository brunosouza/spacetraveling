import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import { RichText } from 'prismic-dom';
import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { useRouter } from 'next/router';
import Comments from '../../components/comments';

interface NextPrevPostProps {
  uid?: string;
  data: {
    title: string;
  };
}

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  nextPost: NextPrevPostProps | null;
  prevPost: NextPrevPostProps | null;
  preview: boolean;
}

export default function Post({ post, nextPost, prevPost, preview }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <span className={styles.loading}>Carregando...</span>;
  }

  const readingTime = post.data.content.reduce((totalTime, content) => {
    let textLength =
      RichText.asText(content.body).split(' ').length +
      content.heading.split(' ').length;

    return (totalTime += Math.ceil(textLength / 200));
  }, 0);

  return (
    <>
      <Head>
        <title>{post.data.title} | spacetraveling</title>
      </Head>
      <div className={styles.bannerWrapper}>
        <img src={post.data.banner.url} alt={post.data.title} />
      </div>
      <main className={commonStyles.contentWrapper}>
        <div className={styles.postHeader}>
          <h1>{post.data.title}</h1>
          <div className={styles.postMeta}>
            <time>
              <FiCalendar />
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </time>
            <span>
              <FiUser />
              {post.data.author}
            </span>
            <time>
              <FiClock />
              {readingTime} min
            </time>
            <time className={styles.lastModified}>
              * editado em&nbsp;
              {format(
                new Date(post.last_publication_date),
                "dd MMM yyyy, 'às' HH:mm",
                {
                  locale: ptBR,
                }
              )}
            </time>
          </div>
        </div>
        {post.data.content.map(content => {
          return (
            <div className={styles.postContent} key={content.heading}>
              <h2>{content.heading}</h2>
              <div
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </div>
          );
        })}
        <footer className={commonStyles.postFooter}>
          <hr />
          <div className={commonStyles.postsNavigation}>
            {!!prevPost && (
              <Link href={prevPost.uid}>
                <a>
                  <h2>{prevPost.data.title}</h2>
                  <span>Post anterior</span>
                </a>
              </Link>
            )}
            {!!nextPost && (
              <Link href={nextPost.uid}>
                <a className={commonStyles.nextPost}>
                  <h2>{nextPost.data.title}</h2>
                  <span>Próximo post</span>
                </a>
              </Link>
            )}
          </div>
          <div className={commonStyles.commentsWrapper}>
            <Comments />
          </div>
          {preview && (
            <Link href="/api/exit-preview">
              <a className={commonStyles.exitPreview}>Sair do modo Preview</a>
            </Link>
          )}
        </footer>
      </main>
    </>
  );
  // TODO
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    { fetch: ['post.title', 'post.content'], pageSize: 2 }
  );

  const paths = posts.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  return {
    paths,
    fallback: true,
  };
  // TODO
};

export const getStaticProps: GetStaticProps<PostProps> = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;
  const prismicClient = getPrismicClient();
  const response = await prismicClient.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });
  let nextPost = null;
  let prevPost = null;

  const post = {
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    uid: response.uid,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => {
        return content;
      }),
    },
  };

  try {
    const nextPostResponse = await prismicClient.query(
      Prismic.predicates.at('document.type', 'posts'),
      {
        pageSize: 1,
        orderings: '[document.first_publication_date desc]',
        after: response.id,
      }
    );

    nextPost = {
      uid: nextPostResponse.results[0].uid,
      data: {
        title: nextPostResponse.results[0].data.title,
      },
    };
  } catch {}

  try {
    const prevPostResponse = await prismicClient.query(
      Prismic.predicates.at('document.type', 'posts'),
      {
        pageSize: 1,
        orderings: '[document.first_publication_date]',
        after: response.id,
      }
    );

    prevPost = {
      uid: prevPostResponse.results[0].uid,
      data: {
        title: prevPostResponse.results[0].data.title,
      },
    };
  } catch {}

  return {
    props: {
      post,
      nextPost: nextPost || null,
      prevPost: prevPost || null,
      preview,
    },
  };

  // TODO
};
