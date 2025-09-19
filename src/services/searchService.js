// src/services/searchService.js
import { baseURL } from '../data';

/**
 * Global Search Service
 * Provides comprehensive search across all application data
 */
class SearchService {
  constructor() {
    this.searchableData = {
      candidates: [],
      jobs: [],
      hiringAgencies: [],
      companies: [],
      recruiters: [],
      interviewSlots: [],
    };
    this.lastFetchTime = {};
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes cache
  }

  /**
   * Update searchable data for a specific type
   */
  updateData(type, data) {
    this.searchableData[type] = Array.isArray(data) ? data : [];
    this.lastFetchTime[type] = Date.now();
  }

  /**
   * Check if data needs refresh
   */
  needsRefresh(type) {
    const lastFetch = this.lastFetchTime[type];
    return !lastFetch || (Date.now() - lastFetch) > this.cacheDuration;
  }

  /**
   * Fetch fresh data for search if needed
   */
  async fetchDataIfNeeded(type, authToken) {
    if (!this.needsRefresh(type)) return;

    try {
      let endpoint = '';
      switch (type) {
        case 'candidates':
          endpoint = '/api/candidates/';
          break;
        case 'jobs':
          endpoint = '/api/jobs/jobs/';
          break;
        case 'hiringAgencies':
          endpoint = '/api/users/hiring-agencies/';
          break;
        case 'companies':
          endpoint = '/api/users/companies/';
          break;
        case 'recruiters':
          endpoint = '/api/users/recruiters/';
          break;
        case 'interviewSlots':
          endpoint = '/api/interviews/slots/';
          break;
        default:
          return;
      }

      const response = await fetch(`${baseURL}${endpoint}`, {
        headers: {
          'Authorization': `Token ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.updateData(type, Array.isArray(data) ? data : data.results || []);
      }
    } catch (error) {
      console.error(`Error fetching ${type} for search:`, error);
    }
  }

  /**
   * Search across all data types
   */
  search(query, options = {}) {
    if (!query || query.length < 2) return [];

    const {
      limit = 50,
      includeTypes = ['candidates', 'jobs', 'hiringAgencies', 'companies', 'recruiters', 'interviewSlots'],
      sortByRelevance = true,
    } = options;

    console.log('Search query:', query);
    console.log('Available data:', {
      candidates: this.searchableData.candidates.length,
      jobs: this.searchableData.jobs.length,
      hiringAgencies: this.searchableData.hiringAgencies.length,
      companies: this.searchableData.companies.length,
      recruiters: this.searchableData.recruiters.length,
      interviewSlots: this.searchableData.interviewSlots.length,
    });

    const results = [];
    const lowerQuery = query.toLowerCase();

    // Search candidates
    if (includeTypes.includes('candidates')) {
      this.searchableData.candidates.forEach(candidate => {
        const searchableText = [
          candidate.full_name,
          candidate.email,
          candidate.phone_number,
          candidate.domain_name,
          candidate.job_title,
          candidate.skills,
          candidate.experience_level,
          candidate.current_status,
        ].filter(Boolean).join(' ').toLowerCase();

        if (searchableText.includes(lowerQuery)) {
          results.push({
            id: candidate.id,
            type: 'Candidates',
            title: candidate.full_name || 'Unknown Candidate',
            subtitle: `${candidate.job_title || 'No Job'} • ${candidate.domain_name || 'No Domain'}`,
            description: `${candidate.email || ''} • ${candidate.current_status || 'No Status'}`,
            path: '/candidates',
            detailPath: `/candidates/${candidate.id}`,
            data: candidate,
            relevance: this.calculateRelevance(searchableText, lowerQuery),
          });
        }
      });
    }

    // Search jobs
    if (includeTypes.includes('jobs')) {
      this.searchableData.jobs.forEach(job => {
        const searchableText = [
          job.job_title,
          job.company_name,
          job.domain_name,
          job.spoc_email,
          job.hiring_manager_email,
          job.position_level,
          job.tech_stack_details,
          job.job_description,
        ].filter(Boolean).join(' ').toLowerCase();

        if (searchableText.includes(lowerQuery)) {
          results.push({
            id: job.id,
            type: 'Jobs',
            title: job.job_title || 'Unknown Job',
            subtitle: `${job.company_name || 'No Company'} • ${job.domain_name || 'No Domain'}`,
            description: `${job.position_level || ''} • ${job.spoc_email || ''}`,
            path: '/jobs',
            detailPath: '/jobs',
            data: job,
            relevance: this.calculateRelevance(searchableText, lowerQuery),
          });
        }
      });
    }

    // Search hiring agencies
    if (includeTypes.includes('hiringAgencies')) {
      this.searchableData.hiringAgencies.forEach(agency => {
        const searchableText = [
          agency.first_name,
          agency.last_name,
          agency.email,
          agency.company_name,
          agency.role,
          agency.phone_number,
        ].filter(Boolean).join(' ').toLowerCase();

        if (searchableText.includes(lowerQuery)) {
          results.push({
            id: agency.id,
            type: 'Hiring Agencies',
            title: `${agency.first_name || ''} ${agency.last_name || ''}`.trim() || 'Unknown User',
            subtitle: `${agency.role || 'No Role'} • ${agency.company_name || 'No Company'}`,
            description: agency.email || '',
            path: '/hiring-agencies',
            detailPath: '/hiring-agencies',
            data: agency,
            relevance: this.calculateRelevance(searchableText, lowerQuery),
          });
        }
      });
    }

    // Search companies
    if (includeTypes.includes('companies')) {
      this.searchableData.companies.forEach(company => {
        const searchableText = [
          company.name,
          company.domain,
          company.description,
          company.contact_email,
        ].filter(Boolean).join(' ').toLowerCase();

        if (searchableText.includes(lowerQuery)) {
          results.push({
            id: company.id,
            type: 'Companies',
            title: company.name || 'Unknown Company',
            subtitle: company.domain || 'No Domain',
            description: company.contact_email || '',
            path: '/hiring-agencies',
            detailPath: '/hiring-agencies',
            data: company,
            relevance: this.calculateRelevance(searchableText, lowerQuery),
          });
        }
      });
    }

    // Search interview slots
    if (includeTypes.includes('interviewSlots')) {
      this.searchableData.interviewSlots.forEach(slot => {
        const searchableText = [
          slot.company_name,
          slot.job_title,
          slot.ai_interview_type,
          slot.status,
          slot.slot_type,
          slot.interview_date,
          slot.notes,
        ].filter(Boolean).join(' ').toLowerCase();

        if (searchableText.includes(lowerQuery)) {
          results.push({
            id: slot.id,
            type: 'Interview Scheduler',
            title: `${slot.job_title || 'Interview Slot'} - ${slot.interview_date || ''}`,
            subtitle: `${slot.company_name || 'No Company'} • ${slot.ai_interview_type || 'No Type'}`,
            description: `${slot.status || ''} • ${slot.start_time || ''}-${slot.end_time || ''}`,
            path: '/ai-interview-scheduler',
            detailPath: '/ai-interview-scheduler',
            data: slot,
            relevance: this.calculateRelevance(searchableText, lowerQuery),
          });
        }
      });
    }

    // Sort by relevance if requested
    if (sortByRelevance) {
      results.sort((a, b) => b.relevance - a.relevance);
    }

    return results.slice(0, limit);
  }

  /**
   * Calculate search relevance score
   */
  calculateRelevance(text, query) {
    let score = 0;
    const words = query.split(' ').filter(word => word.length > 0);
    
    words.forEach(word => {
      const index = text.indexOf(word);
      if (index === 0) score += 10; // Starts with query
      else if (index > 0) score += 5; // Contains query
      
      // Bonus for exact word matches
      const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
      if (wordRegex.test(text)) score += 3;
    });

    return score;
  }

  /**
   * Get search suggestions based on popular searches
   */
  getSearchSuggestions(query = '', limit = 5) {
    const suggestions = [
      'candidates',
      'jobs',
      'interview slots',
      'hiring agencies',
      'companies',
      'scheduled interviews',
      'completed evaluations',
      'available slots',
    ];

    if (!query) return suggestions.slice(0, limit);

    return suggestions
      .filter(suggestion => suggestion.toLowerCase().includes(query.toLowerCase()))
      .slice(0, limit);
  }
}

// Export singleton instance
export const searchService = new SearchService();
export default searchService;
