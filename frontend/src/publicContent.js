import initial from './initialContent.json';

const settingsDefaults = {
  email: '',
  phone: '',
  address: '',
  hours: '',
  heroImage: '/img/lumarq-hero.webp',
  heroLine1: 'Digital products',
  heroLine2: 'built for',
  heroLine3: 'what’s next.',
  heroIntro: 'We design and build websites, mobile apps and the systems behind them. One team for the work from first brief to launch.',
  servicesHeading: 'From first idea to',
  servicesEmphasis: 'live product.',
  servicesIntro: 'Build a new product, improve an existing one or bring in specialist support for the work your team needs next.',
  worksHeading: 'See what we',
  worksEmphasis: 'can build.',
  contactTitle: 'Tell us about',
  contactEmphasis: 'your project.',
  contactIntro: 'Share what you want to build, improve or launch. We’ll use your brief to prepare for a conversation about scope and next steps.',
  clientLogos: '',
  clientsHeading: 'What our clients',
  clientsEmphasis: 'say.',
  clientsHeadingEnd: '',
};

const aboutDefaults = {
  heading: 'Meet Lumarq',
  emphasis: 'Digital.',
  first: 'Lumarq Digital is a design and engineering studio for businesses building or improving digital products. We bring website development, mobile apps, product design, search and cloud infrastructure into one delivery team.',
  second: 'We work with founders preparing a first launch, businesses improving an existing platform and product teams that need specialist support. We start by agreeing on what the project needs to achieve and what should ship first.',
  mission: 'Our aim is to deliver products your business can run, maintain and build on after launch.',
  teamImage: '',
  officeImage: '',
};

function withNewDefaults(original, updates, defaults) {
  const result = { ...original, ...updates };
  for (const [key, value] of Object.entries(defaults)) {
    if (result[key] === original[key]) result[key] = value;
  }
  return result;
}

const sampleWorks = new Map(initial.works.map(work => [work._id, work]));
const sampleClients = new Map(initial.clients.map(client => [client._id, client]));
const sampleServices = new Map(initial.services.map(service => [service._id, service]));
const sampleDescriptions = {
  '200000000000000000000002': 'A SaaS reporting dashboard designed around real-time team insights.',
  '200000000000000000000003': 'A website migration and content system concept for a clinic network.',
  '200000000000000000000004': 'An autoscaling cloud infrastructure concept for a fleet-tracking backend.',
};

export function getPublicContent(content) {
  const works = (content?.works ?? initial.works).map(work => {
    const sample = sampleWorks.get(work._id);
    const isExample = sample?.name === work.name;
    const description = sample?.description === work.description
      ? sampleDescriptions[work._id] || work.description
      : work.description;
    return { ...work, description, isExample, kpi: isExample || work.kpi === sample?.kpi ? '' : work.kpi };
  });
  const clients = (content?.clients ?? []).filter(client => {
    const sample = sampleClients.get(client._id);
    return client.quote && client.quote !== sample?.quote;
  }).map(client => ({
    ...client,
    image: client.image === sampleClients.get(client._id)?.image ? '' : client.image,
  }));
  const services = (content?.services ?? initial.services).map(service => {
    const sample = sampleServices.get(service._id);
    return { ...service, metric: service.metric === sample?.metric && service.metricLabel === sample?.metricLabel ? '' : service.metric };
  });
  const about = withNewDefaults(initial.about, content?.about, aboutDefaults);
  const profileStats = [0, 1, 2, 3].flatMap(index => {
    const keys = ['count', 'suffix', 'label'].map(field => field + index);
    const [count, suffix, label] = keys.map(key => about[key]);
    return label && keys.some(key => about[key] !== initial.about[key])
      ? [{ index, value: String(count) + suffix, label }]
      : [];
  });
  return {
    settings: withNewDefaults(initial.settings, content?.settings, settingsDefaults),
    about: { ...about, profileStats },
    works,
    clients,
    services,
  };
}
