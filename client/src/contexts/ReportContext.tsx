import { useIonToast } from '@ionic/react';
import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { Report, ReportData, ReportForm, ReportResponseForm } from '../models/report.model';
import api from '../services/api';

interface ReportContextProps {
  reports: ReportData[];
  userReports: Report[];
  currentReport: Report | null;
  isLoading: boolean;
  error: string | null;
  fetchAllReports: () => Promise<void>;
  fetchUserReports: () => Promise<void>;
  fetchReportById: (id: number) => Promise<void>;
  submitReport: (reportData: ReportForm) => Promise<void>;
  updateReportStatus: (id: number, status: 'pending' | 'reviewing' | 'resolved') => Promise<void>;
  respondToReport: (reportId: number, responseData: ReportResponseForm) => Promise<void>;
}

const ReportContext = createContext<ReportContextProps | undefined>(undefined);

export const ReportProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [userReports, setUserReports] = useState<Report[]>([]);
  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [present] = useIonToast();

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    present({
      message,
      duration: 3000,
      position: 'bottom',
      color: type === 'success' ? 'success' : 'danger'
    });
  };

  // Fetch all reports (admin only)
  const fetchAllReports = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get('/report/all');
      setReports(response.data.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch reports.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  },[showToast]);

  // Fetch logged-in user's reports
  const fetchUserReports = useCallback( async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get('/report/user');
      setUserReports(response.data.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch your reports.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  },[showToast]);

  // Fetch a specific report by ID
  const fetchReportById = useCallback(async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get(`/report/single/${id}`);
      setCurrentReport(response.data.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch report details.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  },[showToast]);

  // Submit a new report
  const submitReport = async (reportData: ReportForm) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const formData = new FormData();
      Object.entries(reportData).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'image' && value instanceof File) {
            formData.append('image', value);
          } else {
            formData.append(key, String(value));
          }
        }
      });
      
      const response = await api.post('/report', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Add to user reports list
      setUserReports([response.data, ...userReports]);
      
      showToast('Report submitted successfully. Thank you for your contribution!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to submit report.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Update a report's status (admin only)
  const updateReportStatus = async (id: number, status: 'pending' | 'reviewing' | 'resolved') => {
    try {
      setIsLoading(true);
      setError(null);
      
      await api.put(`/report/${id}/status`, { status });
      
      // Update in reports list
      setReports(reports.map(report => 
        report.report.id === id ? { ...report, status } : report
      ));
      
      // Update in user reports list if exists
      setUserReports(userReports.map(report => 
        report.id === id ? { ...report, status } : report
      ));
      
      // Update current report if this is the one being viewed
      if (currentReport && currentReport.id === id) {
        setCurrentReport({ ...currentReport, status });
      }
      
      showToast(`Report status updated to ${status}`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update report status.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Add a response to a report
  const respondToReport = async (reportId: number, responseData: ReportResponseForm) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.post(`/report/${reportId}/respond`, responseData);
      
      // If we're viewing this report, update its responses
      if (currentReport && currentReport.id === reportId) {
        const updatedResponses = [...(currentReport.responses || []), response.data];
        setCurrentReport({ ...currentReport, responses: updatedResponses });
      }
      
      showToast('Response added successfully');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to add response.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ReportContext.Provider
      value={{
        reports,
        userReports,
        currentReport,
        isLoading,
        error,
        fetchAllReports,
        fetchUserReports,
        fetchReportById,
        submitReport,
        updateReportStatus,
        respondToReport
      }}
    >
      {children}
    </ReportContext.Provider>
  );
};

export const useReports = (): ReportContextProps => {
  const context = useContext(ReportContext);
  if (context === undefined) {
    throw new Error('useReports must be used within a ReportProvider');
  }
  return context;
};