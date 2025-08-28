import React, { useState, useEffect } from 'react';
import './DataListing.css';

const DataListing = () => {
  const [activeTab, setActiveTab] = useState('sessions');
  const [sessions, setSessions] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [codeSubmissions, setCodeSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const API_BASE_URL = 'http://localhost:8000/interview_app';

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Test API connection on component mount
  useEffect(() => {
    const testAPI = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/test/`);
        const data = await response.json();
        console.log('API Test Response:', data);
      } catch (error) {
        console.error('API Test Error:', error);
      }
    };
    testAPI();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      switch (activeTab) {
                 case 'sessions':
           const sessionsResponse = await fetch(`${API_BASE_URL}/api/interview-sessions/`);
           if (sessionsResponse.ok) {
             const sessionsData = await sessionsResponse.json();
             console.log('Sessions API response:', sessionsData);
             setSessions(sessionsData.data || []);
           } else {
             console.error('Sessions API error:', sessionsResponse.status, sessionsResponse.statusText);
             throw new Error(`Failed to fetch sessions: ${sessionsResponse.status}`);
           }
           break;
           
         case 'questions':
           const questionsResponse = await fetch(`${API_BASE_URL}/api/interview-questions/`);
           if (questionsResponse.ok) {
             const questionsData = await questionsResponse.json();
             setQuestions(questionsData.data || []);
           } else {
             throw new Error('Failed to fetch questions');
           }
           break;
           
         case 'submissions':
           const submissionsResponse = await fetch(`${API_BASE_URL}/api/code-submissions/`);
           if (submissionsResponse.ok) {
             const submissionsData = await submissionsResponse.json();
             setCodeSubmissions(submissionsData.data || []);
           } else {
             throw new Error('Failed to fetch code submissions');
           }
           break;
          
        default:
          break;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'COMPLETED': 'success',
      'SCHEDULED': 'warning',
      'EXPIRED': 'danger',
      'active': 'success',
      'paused': 'warning',
      'error': 'danger'
    };
    
    return (
      <span className={`status-badge ${statusColors[status] || 'default'}`}>
        {status}
      </span>
    );
  };

  const getQuestionTypeBadge = (type) => {
    const typeColors = {
      'TECHNICAL': 'primary',
      'BEHAVIORAL': 'info',
      'CODING': 'warning'
    };
    
    return (
      <span className={`type-badge ${typeColors[type] || 'default'}`}>
        {type}
      </span>
    );
  };

  const filterData = (data) => {
    let filtered = data;
    
    if (searchTerm) {
      filtered = filtered.filter(item => {
        if (activeTab === 'sessions') {
          return item.candidate_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 item.candidate_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 item.session_key?.toLowerCase().includes(searchTerm.toLowerCase());
        } else if (activeTab === 'questions') {
          return item.question_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 item.session?.candidate_name?.toLowerCase().includes(searchTerm.toLowerCase());
        } else if (activeTab === 'submissions') {
          return item.submitted_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 item.session?.candidate_name?.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return false;
      });
    }
    
    if (filterStatus !== 'all' && activeTab === 'sessions') {
      filtered = filtered.filter(item => item.status === filterStatus);
    }
    
    return filtered;
  };

  const renderSessionsTable = () => {
    const filteredSessions = filterData(sessions);
    
    return (
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Session Key</th>
              <th>Candidate</th>
              <th>Email</th>
              <th>Status</th>
              <th>Scheduled</th>
              <th>Created</th>
              <th>Evaluated</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {filteredSessions.map((session) => (
              <tr key={session.id}>
                <td>
                  <code className="session-key">{session.session_key}</code>
                </td>
                <td>
                  <div className="candidate-info">
                    <strong>{session.candidate_name}</strong>
                  </div>
                </td>
                <td>{session.candidate_email}</td>
                <td>{getStatusBadge(session.status)}</td>
                <td>{session.scheduled_at ? formatDate(session.scheduled_at) : 'N/A'}</td>
                <td>{formatDate(session.created_at)}</td>
                <td>
                  <span className={`evaluated-badge ${session.is_evaluated ? 'yes' : 'no'}`}>
                    {session.is_evaluated ? 'Yes' : 'No'}
                  </span>
                </td>
                <td>
                  {session.overall_performance_score ? (
                    <span className="score-badge">
                      {session.overall_performance_score.toFixed(1)}%
                    </span>
                  ) : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderQuestionsTable = () => {
    const filteredQuestions = filterData(questions);
    
    return (
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Candidate</th>
              <th>Question</th>
              <th>Type</th>
              <th>Level</th>
              <th>Order</th>
              <th>Language</th>
              <th>Response Time</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuestions.map((question) => (
              <tr key={question.id}>
                <td>
                  <code className="question-id">{question.id}</code>
                </td>
                <td>{question.session?.candidate_name || 'N/A'}</td>
                <td>
                  <div className="question-text">
                    {question.question_text.length > 100 
                      ? `${question.question_text.substring(0, 100)}...` 
                      : question.question_text}
                  </div>
                </td>
                <td>{getQuestionTypeBadge(question.question_type)}</td>
                <td>{question.question_level}</td>
                <td>{question.order + 1}</td>
                <td>{question.coding_language || 'N/A'}</td>
                <td>
                  {question.response_time_seconds ? (
                    <span className="time-badge">
                      {question.response_time_seconds.toFixed(1)}s
                    </span>
                  ) : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSubmissionsTable = () => {
    const filteredSubmissions = filterData(codeSubmissions);
    
    return (
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Question ID</th>
              <th>Code</th>
              <th>Language</th>
              <th>Status</th>
              <th>Created</th>
              <th>Output</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubmissions.map((submission) => (
              <tr key={submission.id}>
                <td>{submission.session?.candidate_name || 'N/A'}</td>
                <td>
                  <code className="question-id">{submission.question_id}</code>
                </td>
                <td>
                  <div className="code-preview">
                    <pre>{submission.submitted_code.substring(0, 100)}...</pre>
                  </div>
                </td>
                <td>{submission.language}</td>
                <td>
                  <span className={`test-badge ${submission.passed_all_tests ? 'passed' : 'failed'}`}>
                    {submission.passed_all_tests ? 'Passed' : 'Failed'}
                  </span>
                </td>
                <td>{formatDate(submission.created_at)}</td>
                <td>
                  <div className="output-preview">
                    {submission.output_log ? (
                      <pre>{submission.output_log.substring(0, 50)}...</pre>
                    ) : 'N/A'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="data-listing-container">
      <div className="data-listing-header">
        <h1>Interview Data Dashboard</h1>
        <p>View and manage all interview-related data</p>
      </div>

      <div className="data-listing-controls">
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'sessions' ? 'active' : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            📋 Interview Sessions ({sessions.length})
          </button>
          <button 
            className={`tab-button ${activeTab === 'questions' ? 'active' : ''}`}
            onClick={() => setActiveTab('questions')}
          >
            ❓ Questions ({questions.length})
          </button>
          <button 
            className={`tab-button ${activeTab === 'submissions' ? 'active' : ''}`}
            onClick={() => setActiveTab('submissions')}
          >
            💻 Code Submissions ({codeSubmissions.length})
          </button>
        </div>

        <div className="filters">
          <div className="search-box">
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          {activeTab === 'sessions' && (
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="status-filter"
            >
              <option value="all">All Status</option>
              <option value="COMPLETED">Completed</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="EXPIRED">Expired</option>
            </select>
          )}
          
          <button onClick={fetchData} className="refresh-button">
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="data-content">
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading data...</p>
          </div>
        )}

        {error && (
          <div className="error-container">
            <p>❌ Error: {error}</p>
            <button onClick={fetchData} className="retry-button">
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {activeTab === 'sessions' && renderSessionsTable()}
            {activeTab === 'questions' && renderQuestionsTable()}
            {activeTab === 'submissions' && renderSubmissionsTable()}
          </>
        )}
      </div>
    </div>
  );
};

export default DataListing;
