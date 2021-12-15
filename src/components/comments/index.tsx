import React, { useEffect } from 'react';

const commentNodeId = 'comments';

const Comments = () => {
  useEffect(() => {
    // highlight-start
    const script = document.createElement('script');
    script.src = 'https://utteranc.es/client.js';
    script.async = true;
    script.setAttribute('repo', 'brunosouza/spacetraveling');
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('label', 'comment :speech_balloon:');
    script.setAttribute('theme', 'photon-dark');
    script.setAttribute('crossorigin', 'anonymous');

    // repo="brunosouza/spacetraveling"
    //   issue-term="pathname"
    //   theme="github-dark"
    //   crossorigin="anonymous"

    const scriptParentNode = document.getElementById(commentNodeId);
    scriptParentNode.appendChild(script);
    // highlight-end

    return () => {
      // cleanup - remove the older script with previous theme
      scriptParentNode.removeChild(scriptParentNode.firstChild);
    };
  }, []);

  return <div id={commentNodeId} />;
};

export default Comments;
