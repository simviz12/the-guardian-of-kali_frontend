/**
 * SessionHistory component.
 *
 * Filterable, sortable, and paginated React table component consuming GET /history.
 * Columns: Time, Command, Origin, Policy Decision, Result.
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { apiClient, CommandHistoryItem, HistoryFilters, parseAppError } from '../../services/apiClient';
import { PolicyIndicator } from '../policy/PolicyIndicator';
import { GlobalErrorBanner } from '../common/GlobalErrorBanner';
import { RiskLevel } from '../../types/policy';
import { AppErrorDetails } from '../../types/errors';

export interface SessionHistoryProps {
  sessionId?: string;
  className?: string;
  onSelectCommand?: (commandText: string) => void;
}

type SortField = 'timestamp' | 'text' | 'origin' | 'risk_level';
type SortOrder = 'asc' | 'desc';

export const SessionHistory: React.FC<SessionHistoryProps> = ({
  sessionId,
  className = '',
  onSelectCommand,
}) => {
  const [commands, setCommands] = useState<CommandHistoryItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorDetails, setErrorDetails] = useState<AppErrorDetails | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrigin, setSelectedOrigin] = useState<string>('ALL');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');

  // Sort state
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Copied command toast state
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Fetch history from backend API
  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setErrorDetails(null);

    const filters: HistoryFilters = {};
    if (sessionId) {
      filters.sessionId = sessionId;
    }
    if (selectedRisk !== 'ALL') {
      filters.riskLevel = selectedRisk as HistoryFilters['riskLevel'];
    }

    const result = await apiClient.getHistory(filters);

    setIsLoading(false);

    if (result.success) {
      setCommands(result.data.commands || []);
      setTotalCount(result.data.count || 0);
    } else {
      setErrorDetails(parseAppError(result.error));
    }
  }, [sessionId, selectedRisk]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Handle manual copy
  const handleCopyCommand = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  // Client-side filtering & sorting for smooth UX
  const filteredAndSortedCommands = useMemo(() => {
    let list = [...commands];

    // Search query filter (matches command text or target)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (cmd) =>
          cmd.text.toLowerCase().includes(q) ||
          (cmd.target && cmd.target.toLowerCase().includes(q))
      );
    }

    // Origin filter
    if (selectedOrigin !== 'ALL') {
      list = list.filter((cmd) => cmd.origin === selectedOrigin);
    }

    // Risk level filter (if not already filtered by API query)
    if (selectedRisk !== 'ALL') {
      list = list.filter((cmd) => cmd.risk_level === selectedRisk);
    }

    // Sort
    list.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'timestamp') {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        comparison = timeA - timeB;
      } else if (sortField === 'text') {
        comparison = a.text.localeCompare(b.text);
      } else if (sortField === 'origin') {
        comparison = a.origin.localeCompare(b.origin);
      } else if (sortField === 'risk_level') {
        const riskRank: Record<string, number> = {
          LOW: 1,
          MEDIUM: 2,
          HIGH: 3,
          BLOCKED: 4,
        };
        const rankA = a.risk_level ? riskRank[a.risk_level] || 0 : 0;
        const rankB = b.risk_level ? riskRank[b.risk_level] || 0 : 0;
        comparison = rankA - rankB;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return list;
  }, [commands, searchQuery, selectedOrigin, selectedRisk, sortField, sortOrder]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedCommands.length / pageSize));
  const paginatedCommands = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedCommands.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedCommands, currentPage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const renderSortArrow = (field: SortField) => {
    if (sortField !== field) {
      return <span className="text-zinc-600 ml-1">↕</span>;
    }
    return <span className="text-emerald-400 ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className={`flex flex-col h-full bg-zinc-950 text-zinc-100 rounded-lg border border-zinc-800 ${className}`}>
      {/* Header & Controls Toolbar */}
      <div className="p-4 border-b border-zinc-800 space-y-3 bg-zinc-900/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-bold tracking-wide uppercase text-zinc-200">
              Execution & Policy Audit History
            </h3>
            <span className="text-xs text-zinc-500 font-mono">
              ({filteredAndSortedCommands.length} of {totalCount} records)
            </span>
          </div>

          <button
            onClick={fetchHistory}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition disabled:opacity-50"
            title="Refresh History"
          >
            <span className={isLoading ? 'animate-spin inline-block' : ''}>↻</span>
            <span>Refresh</span>
          </button>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter commands or targets..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1.5 text-xs text-zinc-400 hover:text-zinc-200"
              >
                ✕
              </button>
            )}
          </div>

          {/* Origin Filter */}
          <div className="flex items-center space-x-1.5">
            <label className="text-xs text-zinc-400 font-medium">Origin:</label>
            <select
              value={selectedOrigin}
              onChange={(e) => {
                setSelectedOrigin(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="ALL">All Origins</option>
              <option value="AI">AI Co-pilot</option>
              <option value="MANUAL_USER">Manual Operator</option>
            </select>
          </div>

          {/* Risk Level Filter */}
          <div className="flex items-center space-x-1.5">
            <label className="text-xs text-zinc-400 font-medium">Risk:</label>
            <select
              value={selectedRisk}
              onChange={(e) => {
                setSelectedRisk(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="BLOCKED">BLOCKED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <table className="w-full border-collapse text-left text-xs">
          {/* Table Header */}
          <thead className="sticky top-0 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider select-none z-10">
            <tr>
              <th
                onClick={() => handleSort('timestamp')}
                className="py-2.5 px-3.5 cursor-pointer hover:text-zinc-200 transition whitespace-nowrap"
              >
                Time {renderSortArrow('timestamp')}
              </th>
              <th
                onClick={() => handleSort('text')}
                className="py-2.5 px-3.5 cursor-pointer hover:text-zinc-200 transition"
              >
                Command {renderSortArrow('text')}
              </th>
              <th
                onClick={() => handleSort('origin')}
                className="py-2.5 px-3.5 cursor-pointer hover:text-zinc-200 transition whitespace-nowrap"
              >
                Origin {renderSortArrow('origin')}
              </th>
              <th
                onClick={() => handleSort('risk_level')}
                className="py-2.5 px-3.5 cursor-pointer hover:text-zinc-200 transition whitespace-nowrap"
              >
                Policy Decision {renderSortArrow('risk_level')}
              </th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Result</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-zinc-800/60 font-sans">
            {isLoading && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-zinc-500">
                  <div className="inline-flex items-center space-x-2">
                    <span className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                    <span>Loading audit records from SQLite...</span>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading && errorDetails && (
              <tr>
                <td colSpan={5} className="p-4">
                  <GlobalErrorBanner
                    error={errorDetails}
                    onRetry={fetchHistory}
                  />
                </td>
              </tr>
            )}

            {!isLoading && !errorDetails && paginatedCommands.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-zinc-500">
                  <div className="space-y-1">
                    <p className="text-zinc-400 font-medium">No command history records found</p>
                    <p className="text-[11px] text-zinc-600">
                      {searchQuery || selectedOrigin !== 'ALL' || selectedRisk !== 'ALL'
                        ? 'Try clearing active filters to see all recorded commands.'
                        : 'Commands executed through terminal or chat will appear here.'}
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading &&
              !errorDetails &&
              paginatedCommands.map((cmd, idx) => {
                const dateObj = new Date(cmd.timestamp);
                const formattedTime = isNaN(dateObj.getTime())
                  ? cmd.timestamp
                  : dateObj.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    });
                const formattedDate = isNaN(dateObj.getTime())
                  ? ''
                  : dateObj.toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    });

                const risk = (cmd.risk_level as RiskLevel) || 'LOW';
                const isBlocked = risk === 'BLOCKED';

                return (
                  <tr
                    key={`${cmd.timestamp}-${idx}`}
                    className="hover:bg-zinc-900/50 transition-colors group"
                  >
                    {/* Time Column */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap text-zinc-400 font-mono text-[11px]">
                      <div>{formattedTime}</div>
                      {formattedDate && (
                        <div className="text-[10px] text-zinc-600">{formattedDate}</div>
                      )}
                    </td>

                    {/* Command Column */}
                    <td className="py-2.5 px-3.5 max-w-md">
                      <div className="flex items-center justify-between gap-2">
                        <code
                          onClick={() => onSelectCommand && onSelectCommand(cmd.text)}
                          className={`font-mono text-xs break-all ${
                            onSelectCommand
                              ? 'cursor-pointer hover:underline text-zinc-200 hover:text-emerald-400'
                              : 'text-zinc-300'
                          }`}
                          title={cmd.text}
                        >
                          {cmd.text}
                        </code>

                        <button
                          onClick={() => handleCopyCommand(cmd.text, idx)}
                          className="opacity-0 group-hover:opacity-100 transition px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 hover:text-zinc-200"
                          title="Copy command"
                        >
                          {copiedIndex === idx ? 'Copied!' : 'Copy'}
                        </button>
                      </div>

                      {cmd.target && (
                        <span className="inline-block mt-1 text-[10px] text-zinc-500 font-mono">
                          target: <strong className="text-zinc-400">{cmd.target}</strong>
                        </span>
                      )}
                    </td>

                    {/* Origin Column */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      {cmd.origin === 'AI' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-950/60 text-purple-400 border border-purple-800/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                          AI
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-950/60 text-blue-400 border border-blue-800/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          USER
                        </span>
                      )}
                    </td>

                    {/* Policy Decision Column */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <PolicyIndicator
                        riskLevel={risk}
                        action={
                          isBlocked
                            ? 'BLOCK'
                            : risk === 'MEDIUM' || risk === 'HIGH'
                            ? 'REQUIRE_CONFIRMATION'
                            : 'AUTO_EXECUTE'
                        }
                        reason={
                          cmd.policy_decision ||
                          (isBlocked
                            ? 'Blocked by safety engine blacklist rule'
                            : `Evaluated ${risk} risk level under active policy gate.`)
                        }
                        size="sm"
                      />
                    </td>

                    {/* Result Column */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      {isBlocked ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950/50 text-rose-400 border border-rose-800/40">
                          BLOCKED
                        </span>
                      ) : cmd.result ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                            cmd.result === 'SUCCESS' || cmd.result === '0'
                              ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/40'
                              : 'bg-amber-950/50 text-amber-400 border border-amber-800/40'
                          }`}
                        >
                          {cmd.result}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800/70 text-zinc-400">
                          COMPLETED
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-900/60 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-zinc-400">
        <div className="flex items-center space-x-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span className="text-zinc-500 ml-2">
            Showing{' '}
            {filteredAndSortedCommands.length === 0
              ? 0
              : (currentPage - 1) * pageSize + 1}{' '}
            - {Math.min(currentPage * pageSize, filteredAndSortedCommands.length)} of{' '}
            {filteredAndSortedCommands.length}
          </span>
        </div>

        {/* Page navigation */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1 || isLoading}
            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:hover:bg-zinc-800 text-zinc-300 transition"
            title="First page"
          >
            «
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1 || isLoading}
            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:hover:bg-zinc-800 text-zinc-300 transition"
            title="Previous page"
          >
            ‹ Prev
          </button>

          <span className="px-2 font-mono text-zinc-300">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages || isLoading}
            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:hover:bg-zinc-800 text-zinc-300 transition"
            title="Next page"
          >
            Next ›
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage >= totalPages || isLoading}
            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:hover:bg-zinc-800 text-zinc-300 transition"
            title="Last page"
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionHistory;
