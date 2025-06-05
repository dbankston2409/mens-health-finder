// Mock data for clinics
export interface Clinic {
  id: number;
  name: string;
  city: string;
  state: string;
  rating: number;
  reviewCount: number;
  tier: 'free' | 'low' | 'high';
  services: string[];
  address: string;
  phone: string;
  website?: string;
  lat?: number;
  lng?: number;
  logo?: string;
  hours?: { day: string; hours: string }[];
  description?: string;
  reviews?: { source: string; author: string; rating: number; text: string }[];
  faqs?: { question: string; answer: string }[];
}

// Mock blog posts
export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  publishDate: string;
  author: string;
  categories: string[];
}

export const mockBlogPosts: BlogPost[] = [
  {
    id: 1,
    title: "Understanding Testosterone Replacement Therapy: Benefits and Considerations",
    slug: "understanding-testosterone-replacement-therapy",
    excerpt: "Testosterone replacement therapy (TRT) has become increasingly popular among men experiencing symptoms of low testosterone. This guide explores the benefits, risks, and what to expect when considering TRT.",
    content: "Full article content here...",
    featuredImage: "https://placehold.co/600x400/333/FFF?text=TRT+Article",
    publishDate: "2023-05-15",
    author: "Dr. Michael Johnson",
    categories: ["TRT", "Men's Health", "Hormone Therapy"]
  },
  {
    id: 2,
    title: "5 Effective Treatments for Erectile Dysfunction in 2023",
    slug: "effective-treatments-erectile-dysfunction-2023",
    excerpt: "Erectile dysfunction affects millions of men, but modern treatment options are more effective than ever. Learn about the latest approaches to addressing ED and reclaiming your confidence.",
    content: "Full article content here...",
    featuredImage: "https://placehold.co/600x400/333/FFF?text=ED+Treatments",
    publishDate: "2023-06-22",
    author: "Dr. Sarah Williams",
    categories: ["Erectile Dysfunction", "Treatment Options", "Men's Health"]
  },
  {
    id: 3,
    title: "Hair Loss in Men: Causes, Prevention, and Treatment Options",
    slug: "hair-loss-men-causes-prevention-treatment",
    excerpt: "Male pattern baldness affects up to 70% of men during their lifetime. This comprehensive guide examines the science behind hair loss and explores proven methods to prevent and treat it.",
    content: "Full article content here...",
    featuredImage: "https://placehold.co/600x400/333/FFF?text=Hair+Loss",
    publishDate: "2023-07-08",
    author: "Dr. Robert Chen",
    categories: ["Hair Loss", "Men's Health", "Treatment Options"]
  },
  {
    id: 4,
    title: "Weight Management Strategies Specifically Designed for Men",
    slug: "weight-management-strategies-for-men",
    excerpt: "Men's bodies respond differently to weight loss approaches than women's. Discover science-backed strategies for effective weight management tailored specifically to male physiology and metabolism.",
    content: "Full article content here...",
    featuredImage: "https://placehold.co/600x400/333/FFF?text=Weight+Management",
    publishDate: "2023-08-14",
    author: "James Wilson, Nutritionist",
    categories: ["Weight Management", "Fitness", "Men's Health"]
  }
];

export const mockClinics: Clinic[] = [
  {
    id: 1,
    name: 'Prime Men\'s Health',
    city: 'Austin',
    state: 'TX',
    rating: 5.0,
    reviewCount: 24,
    tier: 'high',
    services: ['TRT', 'ED Treatment', 'Weight Loss'],
    address: '123 Main St, Austin, TX 78701',
    phone: '(512) 555-1234',
    website: 'https://primemenshealth.com',
    logo: '/images/logos/prime-mens-health-logo.svg',
    lat: 30.2672,
    lng: -97.7431,
    hours: [
      { day: 'Monday', hours: '9:00 AM - 5:00 PM' },
      { day: 'Tuesday', hours: '9:00 AM - 5:00 PM' },
      { day: 'Wednesday', hours: '9:00 AM - 5:00 PM' },
      { day: 'Thursday', hours: '9:00 AM - 5:00 PM' },
      { day: 'Friday', hours: '9:00 AM - 5:00 PM' },
      { day: 'Saturday', hours: 'Closed' },
      { day: 'Sunday', hours: 'Closed' }],
    description: 'Prime Men\'s Health is a leading men\'s health clinic in Austin, TX specializing in testosterone replacement therapy, ED treatment, and weight loss programs. Our team of dedicated medical professionals provides personalized care tailored to your specific health goals.',
    reviews: [
      { source: 'Google', author: 'John D.', rating: 5, text: 'The team at Prime Men\'s Health is amazing. They helped me get my energy back and feel like myself again. Highly recommend!' },
      { source: 'Google', author: 'Michael S.', rating: 5, text: 'Great experience from start to finish. The staff is knowledgeable and the results speak for themselves.' },
      { source: 'Yelp', author: 'Robert T.', rating: 5, text: 'Life-changing results from their TRT program. I feel 10 years younger!' }],
    faqs: [
      { question: 'What is testosterone replacement therapy?', answer: 'Testosterone replacement therapy (TRT) is a medical treatment that helps restore testosterone levels in men with low testosterone. It can help improve energy, mood, sexual function, and overall quality of life.' },
      { question: 'How do I know if I need TRT?', answer: 'Signs of low testosterone include fatigue, reduced sex drive, erectile dysfunction, decreased muscle mass, and mood changes. A blood test can determine if your testosterone levels are below normal range.' },
      { question: 'Is TRT covered by insurance?', answer: 'Many insurance plans cover testosterone replacement therapy if it\'s deemed medically necessary. Our staff can help verify your coverage and discuss payment options.' },
      { question: 'How long does it take to see results from TRT?', answer: 'Most men begin to notice improvements in energy and mood within 2-3 weeks, with continued improvements in sexual function, body composition, and other benefits developing over 3-6 months.' }]},
  {
    id: 2,
    name: 'Elite Men\'s Clinic',
    city: 'Dallas',
    state: 'TX',
    rating: 4.8,
    reviewCount: 36,
    tier: 'low',
    services: ['TRT', 'Hair Loss', 'ED Treatment'],
    address: '456 Oak St, Dallas, TX 75201',
    phone: '(214) 555-5678',
    website: 'https://elitemensclinic.com',
    logo: '/images/logos/elite-mens-clinic-logo.svg',
    lat: 32.7767,
    lng: -96.7970,
    hours: [
      { day: 'Monday', hours: '8:30 AM - 6:00 PM' },
      { day: 'Tuesday', hours: '8:30 AM - 6:00 PM' },
      { day: 'Wednesday', hours: '8:30 AM - 6:00 PM' },
      { day: 'Thursday', hours: '8:30 AM - 6:00 PM' },
      { day: 'Friday', hours: '8:30 AM - 5:00 PM' },
      { day: 'Saturday', hours: '9:00 AM - 1:00 PM' },
      { day: 'Sunday', hours: 'Closed' }],
    description: 'Elite Men\'s Clinic is dedicated to helping men in Dallas achieve optimal health and wellness. We specialize in testosterone replacement therapy, hair loss treatments, and erectile dysfunction solutions. Our clinic is staffed by experienced healthcare professionals who understand men\'s unique health needs.',
    reviews: [
      { source: 'Google', author: 'David W.', rating: 5, text: 'The staff at Elite Men\'s Clinic is professional and knowledgeable. They helped me address my concerns and develop a treatment plan that works for me.' },
      { source: 'Yelp', author: 'James B.', rating: 4, text: 'Good experience overall. The wait times can be a bit long, but the treatment results have been worth it.' },
      { source: 'Google', author: 'Thomas R.', rating: 5, text: 'I\'ve been going to Elite Men\'s Clinic for about 6 months now and have seen significant improvements in my energy levels and overall health.' }],
    faqs: [
      { question: 'What hair loss treatments do you offer?', answer: 'We offer a range of hair loss treatments including prescription medications like finasteride and minoxidil, as well as recommendations for lifestyle changes and supplements that can help slow or reverse hair loss.' },
      { question: 'How do you treat erectile dysfunction?', answer: 'We offer several ED treatment options including oral medications, lifestyle modifications, and addressing underlying health conditions that may contribute to ED, such as low testosterone.' },
      { question: 'Do I need an appointment?', answer: 'Yes, appointments are recommended to minimize wait times, but we do accept walk-ins based on availability.' }]},
  {
    id: 3,
    name: 'Advanced Men\'s Health',
    city: 'Houston',
    state: 'TX',
    rating: 4.5,
    reviewCount: 18,
    tier: 'free',
    services: ['TRT', 'Weight Loss'],
    address: '789 Pine St, Houston, TX 77002',
    phone: '(713) 555-9012',
    lat: 29.7604,
    lng: -95.3698},
  {
    id: 4,
    name: 'Superior Men\'s Clinic',
    city: 'San Antonio',
    state: 'TX',
    rating: 4.7,
    reviewCount: 29,
    tier: 'high',
    services: ['TRT', 'ED Treatment', 'Weight Loss', 'Hair Loss'],
    address: '101 Alamo St, San Antonio, TX 78205',
    phone: '(210) 555-3456',
    logo: '/images/logos/superior-mens-clinic-logo.svg',
    lat: 29.4252,
    lng: -98.4916},
  {
    id: 5,
    name: 'Total Men\'s Health',
    city: 'Austin',
    state: 'TX',
    rating: 4.6,
    reviewCount: 15,
    tier: 'low',
    services: ['TRT', 'ED Treatment'],
    address: '321 Congress Ave, Austin, TX 78701',
    phone: '(512) 555-7890',
    logo: '/images/logos/total-mens-health-logo.svg',
    lat: 30.2672,
    lng: -97.7431},
  {
    id: 6,
    name: 'Optimal Men\'s Clinic',
    city: 'Fort Worth',
    state: 'TX',
    rating: 4.4,
    reviewCount: 22,
    tier: 'free',
    services: ['TRT', 'Weight Loss'],
    address: '555 University Dr, Fort Worth, TX 76107',
    phone: '(817) 555-1234',
    lat: 32.7555,
    lng: -97.3308},
  {
    id: 7,
    name: 'Ageless Men\'s Health',
    city: 'Temecula',
    state: 'CA',
    rating: 4.9,
    reviewCount: 42,
    tier: 'high',
    services: ['TRT', 'ED Treatment', 'Weight Loss', 'Hair Loss', 'Hormone Optimization'],
    address: '29645 Rancho California Road, Temecula, CA 92591',
    phone: '(951) 506-0187',
    website: 'https://agelessmenshealth.com',
    logo: '/images/logos/ageless-mens-health-logo.svg',
    lat: 33.5079,
    lng: -117.1498,
    hours: [
      { day: 'Monday', hours: '8:00 AM - 6:00 PM' },
      { day: 'Tuesday', hours: '8:00 AM - 6:00 PM' },
      { day: 'Wednesday', hours: '8:00 AM - 6:00 PM' },
      { day: 'Thursday', hours: '8:00 AM - 6:00 PM' },
      { day: 'Friday', hours: '8:00 AM - 5:00 PM' },
      { day: 'Saturday', hours: '9:00 AM - 2:00 PM' },
      { day: 'Sunday', hours: 'Closed' }],
    description: 'Ageless Men\'s Health is a premier men\'s health clinic in Temecula, offering comprehensive treatments for low testosterone, ED, weight management, and other men\'s health concerns. Our state-of-the-art facility and experienced medical team are dedicated to helping you feel your best at any age.',
    reviews: [
      { source: 'Google', author: 'Richard K.', rating: 5, text: 'Ageless Men\'s Health transformed my life. The staff is incredible and the results of my TRT program have exceeded all expectations.' },
      { source: 'Yelp', author: 'Marcus T.', rating: 5, text: 'Professional, discreet, and effective. The doctors really took the time to understand my concerns and create a personalized treatment plan.' },
      { source: 'Google', author: 'Jason D.', rating: 5, text: 'After struggling with low energy and weight gain for years, Ageless helped me get back to feeling like myself again. Highly recommended!' }],
    faqs: [
      { question: 'What makes Ageless Men\'s Health different?', answer: 'We offer a comprehensive approach to men\'s health, focusing not just on symptoms but on optimizing your overall wellbeing. Our treatments are personalized, our staff is specialized in men\'s health, and our facility is designed for comfort and privacy.' },
      { question: 'Do you take insurance?', answer: 'We work with most major insurance providers for covered treatments. Our staff can verify your benefits and explain coverage options before beginning treatment.' },
      { question: 'How often do I need to visit for TRT treatment?', answer: 'Treatment frequency varies based on your specific protocol, but most patients visit every 1-2 weeks initially, then transition to less frequent visits once optimal levels are achieved.' },
      { question: 'Is hormone optimization safe?', answer: 'When properly administered and monitored by medical professionals, hormone optimization is safe and effective. We conduct regular blood tests and adjust treatment protocols as needed to maintain optimal hormone levels.' }]},
  {
    id: 8,
    name: 'Huddle Men\'s Health TRT Clinic',
    city: 'Temecula',
    state: 'CA',
    rating: 4.7,
    reviewCount: 31,
    tier: 'low',
    services: ['TRT', 'Peptide Therapy', 'ED Treatment', 'Hormone Optimization'],
    address: '27349 Jefferson Ave STE 116, Temecula, CA 92590',
    phone: '(951) 540-0020',
    website: 'https://huddlemenshealth.com',
    logo: '/images/logos/huddle-mens-health-logo.svg',
    lat: 33.5117,
    lng: -117.1583,
    hours: [
      { day: 'Monday', hours: '9:00 AM - 5:00 PM' },
      { day: 'Tuesday', hours: '9:00 AM - 5:00 PM' },
      { day: 'Wednesday', hours: '9:00 AM - 5:00 PM' },
      { day: 'Thursday', hours: '9:00 AM - 5:00 PM' },
      { day: 'Friday', hours: '9:00 AM - 4:00 PM' },
      { day: 'Saturday', hours: 'By appointment' },
      { day: 'Sunday', hours: 'Closed' }],
    description: 'Huddle Men\'s Health TRT Clinic specializes in testosterone replacement therapy and advanced treatments for men dealing with hormonal imbalances. Our clinic combines cutting-edge technology with personalized care to help men reclaim their energy, vitality, and confidence.',
    reviews: [
      { source: 'Google', author: 'Alex H.', rating: 5, text: 'The team at Huddle Men\'s Health is fantastic. They\'re knowledgeable, professional, and truly care about helping their patients feel better.' },
      { source: 'Yelp', author: 'Chris M.', rating: 4, text: 'Great clinic with a focus on results. My energy levels have improved dramatically since starting treatment here.' },
      { source: 'Google', author: 'Patrick J.', rating: 5, text: 'If you\'re struggling with low T symptoms, I highly recommend Huddle. They\'ve helped me get back to feeling like myself again.' }],
    faqs: [
      { question: 'What is peptide therapy?', answer: 'Peptide therapy uses specific amino acid sequences to stimulate cellular functions and hormone production. We use peptides to help with recovery, muscle growth, fat loss, and overall wellness as part of our comprehensive men\'s health approach.' },
      { question: 'How soon can I expect to feel results from TRT?', answer: 'Most men notice initial improvements in mood and energy within 2-3 weeks, with continued benefits in physical performance, body composition, and sexual function developing over 3-6 months of consistent treatment.' },
      { question: 'Do you offer telemedicine consultations?', answer: 'Yes, we offer telemedicine options for follow-up appointments and certain consultations. Initial evaluations typically require an in-person visit for comprehensive testing.' }]}];

// Service categories with icons
export const serviceCategories = [
  {
    id: 'hormone-optimization',
    title: 'Hormone Optimization',
    description: 'Comprehensive hormone replacement therapy including testosterone, HGH, and thyroid optimization.'
  },
  {
    id: 'sexual-health',
    title: 'Sexual Health',
    description: 'Advanced treatments for erectile dysfunction, premature ejaculation, and sexual wellness.'
  },
  {
    id: 'peptides-performance',
    title: 'Peptides & Performance',
    description: 'Cutting-edge peptide therapies for performance enhancement, recovery, and longevity.'
  },
  {
    id: 'hair-loss-aesthetics',
    title: 'Hair Loss & Aesthetics',
    description: 'Hair restoration treatments, PRP therapy, and aesthetic services for men.'
  },
  {
    id: 'weight-loss-metabolic',
    title: 'Weight Loss & Metabolic',
    description: 'Medical weight management, metabolic optimization, and body composition improvement.'
  },
  {
    id: 'iv-injection-therapy',
    title: 'IV & Injection Therapy',
    description: 'IV nutrient therapy, vitamin injections, and hydration treatments.'
  },
  {
    id: 'regenerative-medicine',
    title: 'Regenerative Medicine',
    description: 'Stem cell therapy, PRP treatments, and advanced regenerative procedures.'
  },
  {
    id: 'diagnostics-panels',
    title: 'Diagnostics & Panels',
    description: 'Comprehensive lab testing, hormone panels, and health diagnostics.'
  }
];