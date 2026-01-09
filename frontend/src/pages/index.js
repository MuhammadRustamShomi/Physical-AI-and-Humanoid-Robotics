import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/mod-1-physical-ai/intro">
            Start Learning
          </Link>
        </div>
      </div>
    </header>
  );
}

const ModuleList = [
  {
    title: 'Module 1: Physical AI Foundations',
    description: 'Core concepts of embodied intelligence and the principles that make physical AI unique.',
    link: '/docs/mod-1-physical-ai/intro',
  },
  {
    title: 'Module 2: ROS 2 Nervous System',
    description: 'Master robotics middleware architecture for building scalable robot systems.',
    link: '/docs/mod-2-ros2/intro',
  },
  {
    title: 'Module 3: Digital Twins',
    description: 'Create simulation environments with Gazebo and Unity for safe experimentation.',
    link: '/docs/mod-3-digital-twins/intro',
  },
  {
    title: 'Module 4: NVIDIA Isaac Platform',
    description: 'Industrial-grade simulation and AI training for production robotics.',
    link: '/docs/mod-4-isaac/intro',
  },
  {
    title: 'Module 5: Vision-Language-Action',
    description: 'Multimodal AI architectures that connect perception to physical action.',
    link: '/docs/mod-5-vla/intro',
  },
  {
    title: 'Module 6: Capstone Project',
    description: 'Build a conversational humanoid robot integrating all learned concepts.',
    link: '/docs/mod-6-capstone/intro',
  },
];

function Module({ title, description, link }) {
  return (
    <div className={clsx('col col--4')}>
      <div className="card margin-bottom--lg">
        <div className="card__header">
          <h3>{title}</h3>
        </div>
        <div className="card__body">
          <p>{description}</p>
        </div>
        <div className="card__footer">
          <Link className="button button--primary button--block" to={link}>
            Explore Module
          </Link>
        </div>
      </div>
    </div>
  );
}

function HomepageModules() {
  return (
    <section className={styles.modules}>
      <div className="container">
        <h2 className="text--center margin-bottom--lg">Curriculum</h2>
        <div className="row">
          {ModuleList.map((props, idx) => (
            <Module key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="AI-native textbook for Physical AI and Humanoid Robotics">
      <HomepageHeader />
      <main>
        <HomepageModules />
      </main>
    </Layout>
  );
}
