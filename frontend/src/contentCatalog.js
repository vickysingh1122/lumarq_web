const image = (name, label) => [name, label, 'image'];
const text = (name, label, type = 'text') => [name, label, type];
const order = text('order', 'Display order', 'order');
export const categories = ['Web', 'Mobile', 'SEO', 'Cloud'];
export const statuses = ['New', 'In progress', 'Closed'];
export const modules = {
  services: { title: 'Services', singular: 'service', filter: 'image', filterLabel: 'Image', options: ['With image', 'Without image'], fields: [
    text('name', 'Name', 'required'), text('description', 'Description', 'textarea'),
    image('image', 'Image'), text('alt', 'Image description'), text('tags', 'Tags (comma-separated)'),
    text('metric', 'Metric'), text('metricLabel', 'Metric label'),
    text('formLabel', 'Consultation option label (leave blank to hide)'), order,
  ] },
  about: { title: 'About', single: true, fields: [
    text('heading', 'Heading', 'required'), text('emphasis', 'Heading emphasis'),
    text('first', 'First paragraph', 'textarea'), text('second', 'Second paragraph', 'textarea'),
    text('mission', 'Mission', 'textarea'), image('teamImage', 'Team image'), image('officeImage', 'Office image'),
    ...Array.from({ length: 4 }, (_, i) => [
      text('count' + i, 'Counter ' + (i + 1) + ' value', 'count'),
      text('suffix' + i, 'Counter ' + (i + 1) + ' suffix'),
      text('label' + i, 'Counter ' + (i + 1) + ' label'),
    ]).flat(),
  ] },
  works: { title: 'Works', singular: 'project', filter: 'category', filterLabel: 'Category', options: categories, fields: [
    text('name', 'Name', 'required'), text('category', 'Category', 'category'),
    text('description', 'Description', 'textarea'), image('image', 'Image'),
    text('alt', 'Image description'), text('kpi', 'Result'), order,
  ] },
  clients: { title: 'Clients', singular: 'client', filter: 'rating', filterLabel: 'Rating', options: ['5 stars', '4 to 4.5 stars', 'Below 4 stars'], fields: [
    text('name', 'Name', 'required'), text('role', 'Title and company'), text('company', 'Company'),
    text('quote', 'Testimonial', 'textarea'), text('rating', 'Rating', 'rating'),
    image('image', 'Photo'), order,
  ] },
  settings: { title: 'Settings', single: true, fields: [
    text('name', 'Business name', 'required'), image('logo', 'Logo'), text('email', 'Email', 'email'),
    text('phone', 'Mobile number', 'phone'), text('address', 'Address', 'textarea'),
    text('hours', 'Business hours'), text('clientLogos', 'Featured company names (comma-separated)'), text('contactTitle', 'Contact heading'),
    text('contactEmphasis', 'Contact heading emphasis'), text('contactIntro', 'Contact introduction', 'textarea'),
    text('heroStatus', 'Hero status'), text('heroLine1', 'Hero heading first line'),
    text('heroLine2', 'Hero heading second line'), text('heroLine3', 'Hero heading third line'),
    text('heroIntro', 'Hero introduction', 'textarea'), image('heroImage', 'Hero image'),
    text('servicesHeading', 'Services heading'), text('servicesEmphasis', 'Services heading emphasis'),
    text('servicesIntro', 'Services introduction', 'textarea'),
    text('worksHeading', 'Works heading'), text('worksEmphasis', 'Works heading emphasis'),
    text('clientsHeading', 'Clients heading'), text('clientsEmphasis', 'Clients heading emphasis'),
    text('clientsHeadingEnd', 'Clients heading ending'),
  ] },
  consultations: { title: 'Consultations', singular: 'request', filter: 'status', filterLabel: 'Status', options: statuses, fields: [] },
};
