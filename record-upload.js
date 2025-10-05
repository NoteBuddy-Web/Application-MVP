import { useEffect } from 'react';
import Head from 'next/head';

export default function RecordUpload() {
  useEffect(() => {
    // Redirect to the working HTML file in the public folder
    // This allows the HTML to work while still being served through Next.js
    window.location.href = '/notebuddy_prototype_record_upload.html';
  }, []);

  return (
    <>
      <Head>
        <title>NoteBuddy - Record/Upload</title>
        <meta name="description" content="Redirecting to record upload page..." />
      </Head>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1>Redirecting to NoteBuddy...</h1>
                     <p>If you are not redirected automatically, <a href="/notebuddy_prototype_record_upload.html">click here</a></p>
        </div>
      </div>
    </>
  );
}
