// src/data.js

// Data from AddCandidates.jsx
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

// NOTE: initialAddCandidates is not directly used by Redux slices,
// but kept for reference if you have logic that uses it outside Redux.
// The main candidate data is initialCandidates below.
export const initialAddCandidates = [
  { name: 'John Doe', domain: 'Cloud Engineering', jobRole: 'FrontEnd Developer', email: 'john.doe@example.com', resumes: [{ name: 'john_doe_resume.pdf' }] },
  { name: 'Jane Smith', domain: 'Testing', jobRole: 'QA Engineer', email: 'jane.smith@example.com', resumes: [{ name: 'jane_smith_resume.docx' }] },
  { name: 'Alice Johnson', domain: 'Data Science', jobRole: 'Data Engineer', email: 'alice.j@example.com', resumes: [{ name: 'alice_resume.pdf' }] },
  { name: 'Bob Williams', domain: 'Software Development', jobRole: 'Full Stack Developer', email: 'bob_dev.pdf', resumes: [{ name: 'bob_dev.pdf' }] },
];

// Main Candidate Data for Redux
export const initialCandidates = [
  {
    id: 1,
    name: "Rohit Sharma",
    email: "rohit.sharma@example.com",
    role: "Software Engineer",
    domain: "Backend",
    status: "Requires Action",
    lastUpdated: "2025-06-26",
    evaluation: null,
    poc: "Rahul J. Waghole",
    applicationDate: "2025-06-26",
  },
  {
    id: 2,
    name: "John Doe",
    email: "john.doe@example.com",
    role: "Frontend Developer",
    domain: "Frontend",
    status: "BR Evaluated",
    lastUpdated: "2025-06-25",
    evaluation: { score: 8.5, result: "Pass", feedback: "Strong technical skills, good problem-solving. Needs to improve on collaborative tools." },
    poc: "Alice Smith",
    applicationDate: "2025-06-25",
  },
  {
    id: 3,
    name: "Jane Smith",
    email: "jane.smith@example.com",
    role: "UI/UX Designer",
    domain: "Design",
    status: "Pending Scheduling",
    lastUpdated: "2025-06-24",
    evaluation: null,
    poc: "Bob Johnson",
    applicationDate: "2025-06-24",
  },
  {
    id: 4,
    name: "Alice Johnson",
    email: "alice.j@example.com",
    role: "DevOps Engineer",
    domain: "Infrastructure",
    status: "Hired",
    lastUpdated: "2025-06-20",
    evaluation: { score: 9.0, result: "Pass", feedback: "Excellent grasp of DevOps principles and tools. Highly recommended." },
    poc: "Charlie Brown",
    applicationDate: "2025-06-20",
  },
  {
    id: 5,
    name: "Bob Williams",
    email: "bob.w@example.com",
    role: "Data Scientist",
    domain: "AI/ML",
    status: "Rejected",
    lastUpdated: "2025-06-18",
    evaluation: { score: 6.2, result: "Fail", feedback: "Lacks experience in machine learning frameworks. Communication could be clearer." },
    poc: "David Green",
    applicationDate: "2025-06-18",
  },
  {
    id: 6,
    name: "Charlie Davis",
    email: "charlie.d@example.com",
    role: "Software Engineer",
    domain: "Backend",
    status: "BR In Process",
    lastUpdated: "2025-06-27",
    evaluation: null,
    poc: "Rahul J. Waghole",
    applicationDate: "2025-06-27",
  },
  {
    id: 7,
    name: "Diana Prince",
    email: "diana.p@example.com",
    role: "Frontend Developer",
    domain: "Frontend",
    status: "Internal Interviews",
    lastUpdated: "2025-06-23",
    evaluation: { score: 7.8, result: "Pass", feedback: "Good understanding of React, able to build responsive UIs. Needs to work on performance optimization." },
    poc: "Alice Smith",
    applicationDate: "2025-06-23",
  },
  {
    id: 8,
    name: "Eve Adams",
    email: "eve.a@example.com",
    role: "UI/UX Designer",
    domain: "Design",
    status: "Offered",
    lastUpdated: "2025-06-15",
    evaluation: { score: 8.9, result: "Pass", feedback: "Exceptional design portfolio and user empathy. Great fit for our team culture." },
    poc: "Bob Johnson",
    applicationDate: "2025-06-15",
  },
  {
    id: 9,
    name: "Frank White",
    email: "frank.w@example.com",
    role: "Data Scientist",
    domain: "AI/ML",
    status: "Offer Rejected",
    lastUpdated: "2025-06-10",
    evaluation: { score: 7.0, result: "Pass", feedback: "Solid foundational knowledge. Declined offer due to another opportunity." },
    poc: "David Green",
    applicationDate: "2025-06-10",
  },
  {
    id: 10,
    name: "Grace Black",
    email: "grace.b@example.com",
    role: "DevOps Engineer",
    domain: "Infrastructure",
    status: "Cancelled",
    lastUpdated: "2025-06-05",
    evaluation: null,
    poc: "Charlie Brown",
    applicationDate: "2025-06-05",
  },
];


export const candidateStatusList = [
  "All",
  "Requires Action",
  "Pending Scheduling",
  "BR In Process",
  "BR Evaluated",
  "Internal Interviews",
  "Offered",
  "Hired",
  "Rejected",
  "Offer Rejected",
  "Cancelled",
];

export const uniqueCandidateDomains = [...new Set(initialCandidates.map(c => c.domain))];
export const uniqueCandidateJobRoles = [...new Set(initialCandidates.map(c => c.role))];
export const uniqueCandidatePocs = [...new Set(initialCandidates.map(c => c.poc))];


// Data from Dashboard.jsx
export const dashboardTopCards = [
  { title: '12,345', subtitle: 'Ssare' },
  { title: '$54,280', subtitle: 'Reviews' },
  { title: '3,278', subtitle: 'Customers' },
  { title: '2,470', subtitle: 'Services' },
];

export const dashboardSalesData = [
  { name: 'Jan', sales: 400 },
  { name: 'Feb', sales: 600 },
  { name: 'Mar', sales: 800 },
  { name: 'Apr', sales: 500 },
  { name: 'May', sales: 900 },
  { name: 'Jun', sales: 750 },
];

export const dashboardUsersData = [
  { name: 'Jan', users: 200 },
  { name: 'Feb', users: 300 },
  { name: 'Mar', users: 500 },
  { name: 'Apr', users: 450 },
  { name: 'May', users: 600 },
  { name: 'Jun', users: 550 },
];

export const dashboardClientsData = [
  { name: 'Arna Nusiniey', email: 'jamegonzot@example.com', status: 'Active', plan: 'Active' },
  { name: 'Auad Stachem', email: 'mali@example.com', status: 'Active', plan: 'Active' },
  { name: 'Aradee Spash', email: 'quier@example.com', status: 'Inactive', plan: 'Inactive' },
  { name: 'Datkawz Starven', email: 'spac@example.com', status: 'Active', plan: 'Inactive' },
  { name: 'Joan Carl', email: 'joan@carl.com', status: 'Active', plan: 'Active' },
  { name: 'Duke Hall', email: 'duke@hall.com', status: 'Inactive', plan: 'Inactive' },
  { name: 'Emma Watson', email: 'emma@example.com', status: 'Active', plan: 'Active' },
  { name: 'Robert Downey', email: 'robert@example.com', status: 'Active', plan: 'Active' },
  { name: 'Chris Evans', email: 'chris@example.com', status: 'Inactive', plan: 'Inactive' },
  { name: 'Scarlett Johansson', email: 'scarlett@example.com', status: 'Active', plan: 'Active' },
];

// Data from Interviews.jsx
export const initialInterviews = [
  {
    id: 1,
    candidateName: 'John Doe',
    status: 'Scheduled',
    jobRole: 'Full Stack Developer',
    interviewDate: '2025-07-23', // Tomorrow
    interviewTime: '10:00 AM',
    round: 'Round 1',
    poc: 'Alice Smith',
    notes: 'Strong technical skills, good cultural fit.'
  },
  {
    id: 2,
    candidateName: 'Jane Smith',
    status: 'Pending Feedback',
    jobRole: 'QA Engineer',
    interviewDate: '2025-07-21', // Yesterday
    interviewTime: '02:00 PM',
    round: 'Round 2',
    poc: 'Bob Johnson',
    notes: 'Needs to improve on automation testing knowledge.'
  },
  {
    id: 3,
    candidateName: 'Alice Johnson',
    status: 'Completed',
    jobRole: 'Data Engineer',
    interviewDate: '2025-07-19', // Past
    interviewTime: '11:00 AM',
    round: 'Final Round',
    poc: 'Charlie Brown',
    notes: 'Excellent candidate, recommended for hire.'
  },
  {
    id: 4,
    candidateName: 'Bob Williams',
    status: 'Scheduled',
    jobRole: 'FrontEnd Developer',
    interviewDate: '2025-07-24', // Upcoming
    interviewTime: '03:30 PM',
    round: 'Round 1',
    poc: 'Alice Smith',
    notes: 'Initial screening, good communication.'
  },
  {
    id: 5,
    candidateName: 'Charlie Davis',
    status: 'Cancelled',
    jobRole: 'UI/UX Designer',
    interviewDate: '2025-07-20', // Past
    interviewTime: '09:00 AM',
    round: 'Initial Screen',
    poc: 'David Green',
    notes: 'Candidate withdrew application.'
  },
  {
    id: 6,
    candidateName: 'Diana Miller',
    status: 'Pending Decision',
    jobRole: 'Software Engineer',
    interviewDate: '2025-07-22', // Today
    interviewTime: '04:00 PM',
    round: 'Round 3',
    poc: 'Eve White',
    notes: 'Final interview completed, awaiting team decision.'
  },
  {
    id: 7,
    candidateName: 'Frank Wilson',
    status: 'Scheduled',
    jobRole: 'Technical Support Executive',
    interviewDate: '2025-07-25', // Upcoming
    interviewTime: '01:00 PM',
    round: 'Round 1',
    poc: 'Bob Johnson',
    notes: 'Scheduled for next week.'
  },
  {
    id: 8,
    candidateName: 'Grace Taylor',
    status: 'Completed',
    jobRole: 'Project Manager',
    interviewDate: '2025-07-18', // Past
    interviewTime: '10:30 AM',
    round: 'Final Round',
    poc: 'Charlie Brown',
    notes: 'Hired for Project Manager position.'
  },
  {
    id: 9,
    name: 'Henry Moore',
    status: 'Pending Feedback',
    jobRole: 'BackEnd Developer',
    interviewDate: '2025-07-22', // Today
    interviewTime: '09:30 AM',
    round: 'Round 2',
    poc: 'Eve White',
    notes: 'Interviewer feedback pending.'
  },
  {
    id: 10,
    candidateName: 'Ivy Clark',
    status: 'Scheduled',
    jobRole: 'Cyber Security Analyst',
    interviewDate: '2025-07-26', // Upcoming
    interviewTime: '02:00 PM',
    round: 'Round 1',
    poc: 'David Green',
    notes: 'First round interview scheduled.'
  },
];

export const interviewTabs = ["All", "Today", "Tomorrow", "Upcoming", "Pending Feedback", "Completed"];
export const allInterviewStatuses = ["Scheduled", "Completed", "Pending Feedback", "Pending Decision", "Cancelled"];
export const uniqueInterviewJobRoles = [...new Set(initialInterviews.map(interview => interview.jobRole))];
export const uniqueInterviewPocs = [...new Set(initialInterviews.map(interview => interview.poc))];

// New Job Data
export const initialJobs = [
  {
    id: 1,
    title: 'Senior Frontend Developer',
    description: 'Developing and maintaining user-facing features using React.js.',
    domain: 'Software Development',
    status: 'Open',
    salaryRange: '$100,000 - $150,000',
    postedDate: '2025-06-01',
    applicants: 15,
    hired: 2,
  },
  {
    id: 2,
    title: 'Cloud Solutions Architect',
    description: 'Designing and implementing scalable cloud solutions on AWS.',
    domain: 'Cloud Engineering',
    status: 'Open',
    salaryRange: '$120,000 - $180,000',
    postedDate: '2025-05-15',
    applicants: 10,
    hired: 1,
  },
  {
    id: 3,
    title: 'QA Automation Engineer',
    description: 'Building and maintaining automated test frameworks.',
    domain: 'Testing',
    status: 'Closed',
    salaryRange: '$80,000 - $120,000',
    postedDate: '2025-04-20',
    applicants: 25,
    hired: 3,
  },
  {
    id: 4,
    title: 'Data Scientist',
    description: 'Analyzing complex datasets and building predictive models.',
    domain: 'Data Science',
    status: 'Open',
    salaryRange: '$110,000 - $160,000',
    postedDate: '2025-06-10',
    applicants: 8,
    hired: 0,
  },
  {
    id: 5,
    title: 'UI/UX Lead Designer',
    description: 'Leading design efforts for new product features.',
    domain: 'UI/UX Design',
    status: 'On Hold',
    salaryRange: '$95,000 - $140,000',
    postedDate: '2025-05-01',
    applicants: 12,
    hired: 0,
  },
  {
    id: 6,
    title: 'Cybersecurity Analyst',
    description: 'Monitoring and responding to security incidents.',
    domain: 'Cyber Security',
    status: 'Open',
    salaryRange: '$90,000 - $130,000',
    postedDate: '2025-06-20',
    applicants: 5,
    hired: 0,
  },
  {
    id: 7,
    title: 'Technical Support Specialist',
    description: 'Providing technical assistance to customers.',
    domain: 'Technical Support',
    status: 'Open',
    salaryRange: '$60,000 - $80,000',
    postedDate: '2025-07-01',
    applicants: 20,
    hired: 0,
  },
  {
    id: 8,
    title: 'Network Engineer',
    description: 'Designing and implementing network infrastructure.',
    domain: 'Networking and Infrastructure',
    status: 'Closed',
    salaryRange: '$85,000 - $125,000',
    postedDate: '2025-03-01',
    applicants: 18,
    hired: 2,
  },
  {
    id: 9,
    title: 'Product Manager',
    description: 'Defining product vision, strategy, and roadmap.',
    domain: 'Product Management',
    status: 'Open',
    salaryRange: '$115,000 - $170,000',
    postedDate: '2025-06-25',
    applicants: 7,
    hired: 0,
  },
  {
    id: 10,
    title: 'Project Manager (IT)',
    description: 'Overseeing IT projects from initiation to closure.',
    domain: 'Project Management',
    status: 'Open',
    salaryRange: '$105,000 - $155,000',
    postedDate: '2025-07-05',
    applicants: 3,
    hired: 0,
  },
];

export const jobStatusList = ["All", "Open", "Closed", "On Hold", "Filled"];
export const uniqueJobDomains = [...new Set(initialJobs.map(job => job.domain))];


// Data for Header search (combining relevant names/titles from all sections)
export const searchableItems = [
  'Dashboard', 'Candidates', 'Jobs', 'Interviews', 'Settings', 'Profile', 'Add Candidates',
  ...initialCandidates.map(c => c.name),
  ...initialCandidates.map(c => c.role),
  ...initialCandidates.map(c => c.domain),
  ...initialCandidates.map(c => c.email),
  ...initialCandidates.map(c => c.poc),
  ...dashboardClientsData.map(c => c.name),
  ...dashboardClientsData.map(c => c.email),
  ...initialInterviews.map(i => i.candidateName),
  ...initialInterviews.map(i => i.jobRole),
  ...initialInterviews.map(i => i.poc),
  ...initialJobs.map(j => j.title), // Add job titles
  ...initialJobs.map(j => j.domain), // Add job domains
];
