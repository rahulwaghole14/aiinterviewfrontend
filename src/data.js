// src/data.js

export const baseURL = "https://ai-interviewer-backend-gx2r.onrender.com"; // Added base URL

export const candidateDomains = [
  'Cloud Engineering',
  'Testing',
  'Data Science',
  'Product Management',
  'Project Management',
  'UI/UX Design',
  'Software Development',
  'Cyber Security',
  'Technical Support',
  'Networking and Infrastructure',
];

export const candidateJobRoles = [
  'FrontEnd Developer',
  'BackEnd Developer',
  'Full Stack Developer',
  'Software Engineer',
  'QA Engineer',
  'Data Engineer',
  'Test Lead',
  'Technical Support Executive',
];

// Removed initialAddCandidates as data will be fetched from API
export const initialAddCandidates = [];

// Removed initialCandidates as data will be fetched from API
export const initialCandidates = [];

export const candidateStatusList = [
  "Requires Action",
  "Interview Pending",
  "Interview Scheduled",
  "Interview Completed",
  "Evaluated",
  "Hired",
  "Rejected",
];

// Generate unique lists for filters - these will now be derived dynamically or left empty if not used
export const uniqueCandidateDomains = []; // Will be populated by fetched data or remain empty
export const uniqueCandidateJobRoles = []; // Will be populated by fetched data or remain empty
export const uniqueCandidatePocs = []; // Will be populated by fetched data or remain empty


// Dashboard Data (keeping as is, assuming it's static or fetched elsewhere)
export const dashboardSummaryData = {
  totalCandidates: 1200,
  activeJobs: 75,
  hiredLastMonth: 45,
  interviewsScheduled: 30,
};

export const dashboardCandidatesByStatus = [
  { status: 'Applied', count: 300 },
  { status: 'Interviewing', count: 250 },
  { status: 'Evaluated', count: 150 },
  { status: 'Offer Extended', count: 80 },
  { status: 'Hired', count: 100 },
  { status: 'Rejected', count: 320 },
];

export const dashboardInterviewsToday = [
  { time: '10:00 AM', candidate: 'Alice Wonderland', role: 'Software Engineer', interviewer: 'Bob The Builder' },
  { time: '02:00 PM', candidate: 'Ivy League', role: 'Data Engineer', interviewer: 'Severus Snape' },
];

export const dashboardRecentActivities = [
  { type: 'interview', description: 'Interview scheduled for Alice Wonderland', date: '2023-05-25' },
  { type: 'status_change', description: 'Bob The Great status changed to Evaluated', date: '2023-05-18' },
  { type: 'new_candidate', description: 'New candidate Charlie Brown added', date: '2023-05-15' },
];

export const dashboardClientsData = [
  {
    id: 'client-1',
    name: 'Tech Solutions Inc.',
    contactPerson: 'Maria Garcia',
    email: 'maria.g@techsolutions.com',
    phone: '123-456-7890',
    status: 'Active',
    jobs: [
      { id: 'job-1', title: 'Senior Backend Developer', status: 'Open', applications: 50, interviews: 10, hired: 2 },
      { id: 'job-2', title: 'DevOps Engineer', status: 'Open', applications: 30, interviews: 5, hired: 1 },
    ],
  },
  {
    id: 'client-2',
    name: 'Global Innovations Ltd.',
    contactPerson: 'David Lee',
    email: 'david.l@globalinnovations.com',
    phone: '098-765-4321',
    status: 'Active',
    jobs: [
      { id: 'job-3', title: 'Product Manager', status: 'Open', applications: 40, interviews: 8, hired: 1 },
    ],
  },
  {
    id: 'client-3',
    name: 'Creative Minds Agency',
    contactPerson: 'Sophia Chen',
    email: 'sophia.c@creativeminds.com',
    phone: '112-233-4455',
    status: 'Inactive',
    jobs: [
      { id: 'job-4', title: 'UX/UI Designer', status: 'Closed', applications: 25, interviews: 7, hired: 1 },
    ],
  },
];

export const initialJobs = [
  {
    id: 'JOB001',
    title: 'Senior Software Engineer',
    domain: 'Software Development',
    client: 'Tech Solutions Inc.',
    status: 'Open',
    datePosted: '2023-01-01',
    applications: 150,
    interviews: 30,
    hires: 5,
    description: 'Developing scalable backend services using Node.js and microservices architecture.',
    requirements: [
      '5+ years experience in backend development',
      'Proficiency in Node.js, Express.js',
      'Experience with microservices and REST APIs',
      'Knowledge of SQL/NoSQL databases',
      'Familiarity with cloud platforms (AWS/Azure/GCP)',
    ],
  },
  {
    id: 'JOB002',
    title: 'Product Manager',
    domain: 'Product Management',
    client: 'Global Innovations Ltd.',
    status: 'Open',
    datePosted: '2023-02-10',
    applications: 80,
    interviews: 15,
    hires: 2,
    description: 'Define product vision, strategy, and roadmap for innovative software products.',
    requirements: [
      '3+ years experience in product management',
      'Strong understanding of agile methodologies',
      'Excellent communication and leadership skills',
      'Experience with market research and competitive analysis',
    ],
  },
  {
    id: 'JOB003',
    title: 'UX/UI Designer',
    domain: 'UI/UX Design',
    client: 'Creative Minds Agency',
    status: 'Closed',
    datePosted: '2023-03-01',
    applications: 120,
    interviews: 25,
    hires: 3,
    description: 'Design intuitive and visually appealing user interfaces for web and mobile applications.',
    requirements: [
      '4+ years experience in UX/UI design',
      'Proficiency in Figma, Sketch, Adobe XD',
      'Strong portfolio showcasing design projects',
      'Understanding of user-centered design principles',
    ],
  },
  {
    id: 'JOB004',
    title: 'Data Scientist',
    domain: 'Data Science',
    client: 'Data Insights Corp.',
    status: 'Open',
    datePosted: '2023-04-05',
    applications: 90,
    interviews: 18,
    hires: 1,
    description: 'Analyze complex datasets, build predictive models, and provide data-driven insights.',
    requirements: [
      'Master\'s or Ph.D. in a quantitative field',
      'Proficiency in Python or R',
      'Experience with machine learning algorithms',
      'Strong statistical modeling skills',
    ],
  },
  {
    id: 'JOB005',
    title: 'Cloud Engineer',
    domain: 'Cloud Engineering',
    client: 'Cloud Innovations',
    status: 'Open',
    datePosted: '2023-05-01',
    applications: 70,
    interviews: 10,
    hires: 0,
    description: 'Design, implement, and manage cloud infrastructure on AWS, Azure, or GCP.',
    requirements: [
      '3+ years experience with cloud platforms',
      'Experience with infrastructure as code (Terraform, CloudFormation)',
      'Knowledge of containerization (Docker, Kubernetes)',
      'Strong scripting skills (Python, Bash)',
    ],
  },
];

export const uniqueJobDomains = [...new Set(initialJobs.map(job => job.domain))];

// Add jobStatusList for Jobs.jsx
export const jobStatusList = [
  "Open",
  "Closed",
  "On Hold",
  "Filled"
];


// Data for Header search (combining relevant names/titles from all sections)
export const searchableItems = [
  { name: 'Dashboard', path: 'dashboard' },
  { name: 'Candidates', path: 'candidates' },
  { name: 'Jobs', path: 'jobs' },
  { name: 'Settings', path: 'settings' },
  { name: 'Profile', path: 'profile' },
  { name: 'Add Candidates', path: 'add-candidates' },
  { name: 'Hiring Agencies', path: 'hiring-agencies' },
  // Ensure these maps correctly use 'jobRole' and include 'resumes'
  // Removed mapping of initialCandidates as it's no longer present
  ...dashboardClientsData.map(c => ({ name: c.name, path: 'dashboard' })),
  ...dashboardClientsData.flatMap(c => c.jobs.map(job => ({ name: job.title, path: `jobs/${job.id}` }))),
  ...initialJobs.map(job => ({ name: job.title, path: `jobs/${job.id}` })),
  ...initialJobs.map(job => ({ name: job.domain, path: 'jobs' })),
];
