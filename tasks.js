import Head from 'next/head';

export default function TasksPage({ htmlContent }) {
  return (
    <>
      <Head>
        <title>NoteBuddy - Tasks</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
      </Head>
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    </>
  );
}

export async function getServerSideProps() {
  try {
    // Import fs only on server side
    const fs = require('fs');
    const path = require('path');
    
    // Read the original HTML file
    const htmlPath = path.join(process.cwd(), 'prototype_package_temp', 'notebuddy_prototype_task_list.html');
    const originalHTML = fs.readFileSync(htmlPath, 'utf8');
    
    // Replace the navigation links to work with Next.js routing
    const modifiedHTML = originalHTML
      // Replace href attributes
      .replace(/href="index\.html"/g, 'href="/"')
      .replace(/href="notebuddy_prototype_calendar_view\.html"/g, 'href="/calendar"')
      .replace(/href="notebuddy_prototype_record_upload\.html"/g, 'href="/record"')
      .replace(/href="notebuddy_prototype_summary_view\.html"/g, 'href="/summary"')
      .replace(/href="notebuddy_prototype_task_list\.html"/g, 'href="/tasks"')
      .replace(/href="notebuddy_prototype_settings_page\.html"/g, 'href="/settings"')
      .replace(/href="notebuddy_prototype_home\.html"/g, 'href="/"')
      // Replace onclick handlers and window.location.href
      .replace(/onclick="window\.location\.href='notebuddy_prototype_summary_view\.html'"/g, 'onclick="window.location.href=\'/summary\'"')
      .replace(/onclick="window\.location\.href='notebuddy_prototype_calendar_view\.html'"/g, 'onclick="window.location.href=\'/calendar\'"')
      .replace(/onclick="window\.location\.href='notebuddy_prototype_task_list\.html'"/g, 'onclick="window.location.href=\'/tasks\'"')
      .replace(/onclick="window\.location\.href='notebuddy_prototype_settings_page\.html'"/g, 'onclick="window.location.href=\'/settings\'"')
      .replace(/onclick="window\.location\.href='notebuddy_prototype_record_upload\.html'"/g, 'onclick="window.location.href=\'/record\'"')
      // Replace any remaining window.location.href in JavaScript
      .replace(/window\.location\.href='notebuddy_prototype_summary_view\.html'/g, "window.location.href='/summary'")
      .replace(/window\.location\.href='notebuddy_prototype_calendar_view\.html'/g, "window.location.href='/calendar'")
      .replace(/window\.location\.href='notebuddy_prototype_task_list\.html'/g, "window.location.href='/tasks'")
      .replace(/window\.location\.href='notebuddy_prototype_settings_page\.html'/g, "window.location.href='/settings'")
      .replace(/window\.location\.href='notebuddy_prototype_record_upload\.html'/g, "window.location.href='/record'");

    return {
      props: {
        htmlContent: modifiedHTML,
      },
    };
  } catch (error) {
    console.error('Error reading HTML file:', error);
    return {
      props: {
        htmlContent: '<div>Error loading page</div>',
      },
    };
  }
}
