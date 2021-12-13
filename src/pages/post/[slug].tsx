import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';

import { RichText } from 'prismic-dom';
import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { useRouter } from 'next/router';

interface Post {
  first_publication_date: string | null;
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
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <span>Carregando...</span>;
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

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    first_publication_date: response.first_publication_date,
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

  return { props: { post } };

  // TODO
};
