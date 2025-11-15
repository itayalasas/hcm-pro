import { useEffect, useState } from 'react';
import { TrendingUp, Star, FileText, Calendar, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Evaluation {
  id: string;
  evaluation_cycle_id: string;
  employee_id: string;
  evaluator_id: string;
  final_score: number;
  final_rating: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function Evaluations() {
  const { employee } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (employee) {
      loadEvaluations();
    }
  }, [employee]);

  const loadEvaluations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('evaluations')
        .select('*')
        .eq('employee_id', employee?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvaluations(data || []);
    } catch (error) {
      console.error('Error loading evaluations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finalized': return 'bg-green-100 text-green-700';
      case 'manager_complete': return 'bg-blue-100 text-blue-700';
      case 'self_complete': return 'bg-amber-100 text-amber-700';
      case 'pending': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating?.toLowerCase()) {
      case 'exceeds': return 'text-green-600';
      case 'meets': return 'text-blue-600';
      case 'needs improvement': return 'text-amber-600';
      case 'unsatisfactory': return 'text-red-600';
      default: return 'text-slate-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Performance Evaluations</h1>
        <p className="text-slate-600">Track your performance reviews and development</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Total Reviews</h3>
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{evaluations.length}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Pending</h3>
            <Calendar className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {evaluations.filter(e => e.status === 'pending' || e.status === 'self_complete').length}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Latest Score</h3>
            <Star className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {evaluations[0]?.final_score?.toFixed(1) || 'N/A'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Latest Rating</h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className={`text-lg font-bold ${getRatingColor(evaluations[0]?.final_rating)}`}>
            {evaluations[0]?.final_rating || 'N/A'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 mb-6">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Evaluation History</h2>
        </div>

        {evaluations.length > 0 ? (
          <div className="divide-y divide-slate-200">
            {evaluations.map((evaluation) => (
              <div key={evaluation.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-slate-900">
                        Performance Review {new Date(evaluation.created_at).getFullYear()}
                      </h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(evaluation.status)}`}>
                        {evaluation.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      Created on {new Date(evaluation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {evaluation.final_score && (
                    <div className="text-right">
                      <div className="text-3xl font-bold text-slate-900 mb-1">
                        {evaluation.final_score.toFixed(1)}
                      </div>
                      <div className={`text-sm font-medium ${getRatingColor(evaluation.final_rating)}`}>
                        {evaluation.final_rating}
                      </div>
                    </div>
                  )}
                </div>

                {evaluation.status === 'finalized' && (
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-500 mb-1">Competencies</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                        <span className="text-sm font-medium text-slate-900">4.2</span>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-500 mb-1">Objectives</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: '90%' }}></div>
                        </div>
                        <span className="text-sm font-medium text-slate-900">4.5</span>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-500 mb-1">Overall</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 rounded-full h-2">
                          <div className="bg-purple-600 h-2 rounded-full" style={{ width: '88%' }}></div>
                        </div>
                        <span className="text-sm font-medium text-slate-900">4.4</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  {evaluation.status === 'pending' || evaluation.status === 'self_complete' ? (
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Complete Self-Evaluation
                    </button>
                  ) : (
                    <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                      View Details
                    </button>
                  )}
                  <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                    Download PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500 mb-2">No evaluations found</p>
            <p className="text-sm text-slate-400">Your performance reviews will appear here</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Development Plans</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[
              { title: 'Improve Technical Leadership Skills', progress: 65, dueDate: '2025-12-31' },
              { title: 'Complete Project Management Certification', progress: 40, dueDate: '2025-06-30' },
              { title: 'Enhance Cross-functional Collaboration', progress: 80, dueDate: '2025-03-31' },
            ].map((plan, idx) => (
              <div key={idx} className="p-4 border border-slate-200 rounded-lg hover:border-blue-500 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900 mb-1">{plan.title}</h3>
                    <p className="text-sm text-slate-500">Due: {new Date(plan.dueDate).toLocaleDateString()}</p>
                  </div>
                  <span className="text-sm font-medium text-slate-900">{plan.progress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${plan.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
