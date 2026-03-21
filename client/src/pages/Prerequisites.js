import React from 'react';
import { FiDownload, FiExternalLink } from 'react-icons/fi';
import './Prerequisites.css';

const prerequisiteItems = [
  { title: 'MongoDB Server', description: 'Self-managed MongoDB for local development.', url: 'https://www.mongodb.com/try/download/community' },
  { title: 'Visual Studio Code', description: 'Free, extensible code editor.', url: 'https://code.visualstudio.com/download' },
  { title: 'GitHub Desktop', description: 'Simplified Git GUI client.', url: 'https://desktop.github.com/download/' },
  { title: 'Oracle Java JDK', description: 'Download Java Development Kit.', url: 'https://www.oracle.com/java/technologies/downloads/' },
  { title: 'Node.js', description: 'JavaScript runtime for backend tools.', url: 'https://nodejs.org/en/download' },
  { title: 'Git', description: 'Distributed version control system.', url: 'https://git-scm.com/downloads' },
  { title: 'Postman', description: 'API client for testing routes.', url: 'https://www.postman.com/downloads/' },
  { title: 'Docker Desktop', description: 'Build and run containers locally.', url: 'https://www.docker.com/products/docker-desktop/' },
  { title: 'Python', description: 'Popular programming language.', url: 'https://www.python.org/downloads/' },
  { title: 'MySQL Community', description: 'Open-source relational database.', url: 'https://dev.mysql.com/downloads/mysql/' },
  { title: 'PostgreSQL', description: 'Advanced open-source database.', url: 'https://www.postgresql.org/download/' },
  { title: '7-Zip', description: 'Free file archiver and extractor.', url: 'https://www.7-zip.org/download.html' },
  { title: 'Sublime Text', description: 'Lightweight and fast code editor.', url: 'https://www.sublimetext.com/download' },
  { title: 'IntelliJ IDEA', description: 'Powerful IDE for Java and full-stack development.', url: 'https://www.jetbrains.com/idea/download/' },
  { title: 'Kubernetes', description: 'Container orchestration platform and tooling.', url: 'https://kubernetes.io/docs/tasks/tools/' },
  { title: 'Eclipse Theia', description: 'Open-source alternative to VS Code.', url: 'https://theia-ide.org/' },
  { title: 'Notepad++', description: 'Simple editor for beginners and quick edits.', url: 'https://notepad-plus-plus.org/downloads/' },
  { title: 'Figma', description: 'Collaborative design and prototyping tool.', url: 'https://www.figma.com/downloads/' },
  { title: 'React', description: 'Frontend library for building UI.', url: 'https://react.dev/learn' },
  { title: 'Angular', description: 'TypeScript framework for web applications.', url: 'https://angular.dev/overview' },
  { title: 'Bootstrap', description: 'CSS framework for responsive web design.', url: 'https://getbootstrap.com/docs/' },
];

const Prerequisites = () => {
  return (
    <div className="prerequisites-page">
      <div className="container">
        <div className="prerequisites-header">
          <h1>Prerequisites</h1>
          <p>Recommended software and tools for your learning environment.</p>
        </div>

        <div className="prerequisites-grid">
          {prerequisiteItems.map((item) => (
            <article key={item.title} className="prerequisite-card">
              <div className="prerequisite-card-content">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="prerequisite-download-link"
              >
                <span><FiDownload /> Download</span>
                <FiExternalLink />
              </a>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Prerequisites;
