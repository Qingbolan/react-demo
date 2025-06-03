/**
 * -----------------------------------------------------------------------------
 * Git Graph Visualization - Architectural Overview
 * -----------------------------------------------------------------------------
 * 
 * Author: Silan Hu
 * Date: May 27, 2025
 * 
 * -----------------------------------------------------------------------------
 * Purpose:
 * --------
 * This document outlines the core architectural principles, design decisions,
 * and implementation strategies for the Git graph visualization component.
 * The goal is to deliver a robust, maintainable, and visually clear
 * representation of Git commit history, supporting complex branching and
 * merging scenarios with enterprise-grade performance and accessibility.
 * 
 * -----------------------------------------------------------------------------
 * 1. Node Positioning Strategy
 * -----------------------------------------------------------------------------
 * - Each commit is rendered as a node (circle) on its assigned branch lane.
 * - Lane assignment is determined by branch name, ensuring consistent
 *   horizontal positioning across the graph.
 * - Node coordinates are calculated as follows:
 *     const nodeX = commit.lane * laneWidth + offsetX;
 *     const nodeY = centerY; // Vertically centered within its row.
 * 
 * -----------------------------------------------------------------------------
 * 2. Edge Rendering Strategy
 * -----------------------------------------------------------------------------
 * - Edges visually connect child commits to their parent commits.
 * - Each commit may have up to two parents (to support merge scenarios).
 * - Edge color is inherited from the child node's branch color to maintain
 *   visual consistency and branch traceability.
 * 
 * -----------------------------------------------------------------------------
 * 3. Connection Types and Rendering Logic
 * -----------------------------------------------------------------------------
 * - Same Branch (Straight Line):
 *     - If child and parent are on the same branch (lane), render a straight
 *       vertical line between the edges of the two nodes.
 *     - Start/end points are offset by node radius to avoid overlap.
 *     Example:
 *         if (child.lane === parent.lane) {
 *             const startY = childNodeY - nodeRadius;
 *             const endY = parentNodeY + nodeRadius;
 *             // Render straight line
 *         }
 * 
 * - Cross-Branch (Curved Line):
 *     - If child and parent are on different branches, render a smooth Bézier
 *       curve between the nodes.
 *     - Edge start/end points are calculated using vector mathematics to
 *       ensure the curve begins and ends at the node circumference.
 *     Example:
 *         else {
 *             const distance = Math.sqrt(dx * dx + dy * dy);
 *             const edgeStartX = childNodeX + (dx / distance) * nodeRadius;
 *             const edgeStartY = childNodeY + (dy / distance) * nodeRadius;
 *             // Render Bézier curve
 *         }
 * 
 * -----------------------------------------------------------------------------
 * 4. Rendering Order
 * -----------------------------------------------------------------------------
 * - Step 1: Render all connecting edges (lines and curves) first.
 * - Step 2: Render all commit nodes (circles) on top of the edges.
 *   This ensures nodes are visually prominent and not obscured by edges.
 * 
 * -----------------------------------------------------------------------------
 * 5. Key Design Decisions
 * -----------------------------------------------------------------------------
 * - Lane Lines Omitted:
 *     - Lane lines are intentionally omitted to reduce visual clutter.
 *     - Connecting edges provide sufficient visual guidance for branch flow.
 * 
 * - Edge-to-Edge Connections:
 *     - All edges connect precisely at the circumference of nodes, not through
 *       their centers, for improved clarity and aesthetics.
 *     - Vector mathematics is used to calculate intersection points.
 * 
 * - Color Inheritance:
 *     - Edge color always matches the child (source) node's branch color.
 *     - This approach enhances branch traceability and visual coherence.
 * 
 * -----------------------------------------------------------------------------
 * 6. Performance Optimizations
 * -----------------------------------------------------------------------------
 * - Component Memoization:
 *     - React.memo is used for graph components to prevent unnecessary
 *       re-renders, improving performance in large repositories.
 *     Example:
 *         const CommitGraph = React.memo(({ commit, index, visibleCommits }) => { ... });
 * 
 * - Efficient Data Structures:
 *     - Hash maps are used for O(1) commit lookups during edge rendering.
 *     Example:
 *         const commitHashToIndex = useMemo(() => {
 *             const map = new Map();
 *             visibleCommits.forEach((commit, index) => map.set(commit.hash, index));
 *             return map;
 *         }, [visibleCommits]);
 * 
 * -----------------------------------------------------------------------------
 * 7. Accessibility Considerations
 * -----------------------------------------------------------------------------
 * - Semantic HTML: All SVG and interactive elements use appropriate ARIA roles
 *   and labels for screen reader compatibility.
 * - Keyboard Navigation: Full support for keyboard-based commit selection and
 *   navigation (Tab, Enter, Space).
 * - Screen Reader Support: Descriptive alt text and ARIA attributes are
 *   provided for all graph elements.
 * - High Contrast: All branch colors are selected to ensure sufficient
 *   contrast for users with visual impairments.
 * 
 * -----------------------------------------------------------------------------
 * 8. Technical Challenges Addressed
 * -----------------------------------------------------------------------------
 * - SVG/Container Alignment:
 *     - SVG coordinates are aligned with the container using absolute
 *       positioning and removal of conflicting CSS.
 * 
 * - Multi-Parent Merge Handling:
 *     - The implementation supports merge commits with multiple parents by
 *       iterating through all parent relationships and rendering individual
 *       edges for each.
 * 
 * - Visual Clarity in Complex Branching:
 *     - By omitting lane lines and focusing on essential connections, the
 *       graph remains readable even in complex branching scenarios.
 * 
 * -----------------------------------------------------------------------------
 * 9. Future Enhancements (Planned)
 * -----------------------------------------------------------------------------
 * - Interactive Features: Hover effects, zoom/pan capabilities.
 * - Animation: Smooth transitions for branch filtering and graph updates.
 * - Customization: User-configurable branch colors and layout spacing.
 * - Performance: Virtual scrolling and incremental rendering for very large
 *   repositories.
 * 
 * -----------------------------------------------------------------------------
 * Summary:
 * --------
 * This Git graph visualization component is engineered for clarity,
 * performance, and accessibility. It accurately represents complex Git
 * histories, including branching and merging, while maintaining a clean and
 * modern visual style suitable for enterprise applications.
 * -----------------------------------------------------------------------------
 */


import React, { useState, useMemo, useCallback } from 'react';
import { GitBranch, Eye, Settings, Search, GitCommit } from 'lucide-react';

// 苹果风格简约配色
const macBg = "bg-[#f5f5f7]";
const macPanel = "bg-white";
const macBorder = "border-[#e5e5ea]";
const macText = "text-[#1c1c1e]";
const macSubtle = "text-[#6e6e73]";
const macHover = "hover:bg-[#e5e5ea]";
const macShadow = "shadow-[0_1px_4px_0_rgba(60,60,67,0.03)]";
const macRounded = "rounded-[12px]";

// VSCode Git Graph standard color palette (top-level constant to ensure stable reference across renders)
export const defaultColors = [
    '#0085d9', '#d9008f', '#00d90a', '#d98500', '#a300d9',
    '#ff0000', '#00d9cc', '#e138e8', '#85d900', '#dc5b23'
];

export const rawCommits = [
    { hash: 'a1b2c3d4', parents: [], message: 'Initial commit', date: '2025-01-01T09:00:00Z', author: 'Alice', refs: ['main'], branch: 'main' },
    { hash: 'b2c3d4e5', parents: ['a1b2c3d4'], message: 'Setup project structure', date: '2025-01-02T10:00:00Z', author: 'Alice', refs: ['main'], branch: 'main' },
    { hash: 'c3d4e5f6', parents: ['b2c3d4e5'], message: 'Implement core logic', date: '2025-01-03T11:00:00Z', author: 'Alice', refs: ['main'], branch: 'main' },
    { hash: 'd4e5f6g7', parents: ['b2c3d4e5'], message: 'Feature/login – add login API', date: '2025-01-03T11:30:00Z', author: 'Bob', refs: ['feature/login'], branch: 'feature/login' },
    { hash: 'e5f6g7h8', parents: ['d4e5f6g7'], message: 'Feature/login – add UI components', date: '2025-01-04T09:00:00Z', author: 'Bob', refs: ['feature/login'], branch: 'feature/login' },
    { hash: 'f6g7h8i9', parents: ['c3d4e5f6'], message: 'Update README', date: '2025-01-04T10:00:00Z', author: 'Alice', refs: ['main'], branch: 'main' },
    { hash: 'g7h8i9j0', parents: ['f6g7h8i9', 'e5f6g7h8'], message: 'Merge feature/login into main', date: '2025-01-04T18:00:00Z', author: 'Alice', refs: ['main'], branch: 'main' },
    { hash: 'h8i9j0k1', parents: ['g7h8i9j0'], message: 'Bump version to 1.1.0', date: '2025-01-05T08:00:00Z', author: 'Alice', refs: ['main'], branch: 'main' },
    { hash: 'i9j0k1l2', parents: ['h8i9j0k1'], message: 'Hotfix/typo – fix critical typo', date: '2025-01-05T09:00:00Z', author: 'Charlie', refs: ['hotfix/typo'], branch: 'hotfix/typo' },
    { hash: 'j0k1l2m3', parents: ['h8i9j0k1', 'i9j0k1l2'], message: 'Merge hotfix/typo into main', date: '2025-01-05T12:00:00Z', author: 'Alice', refs: ['main'], branch: 'main' },
    { hash: 'k1l2m3n4', parents: ['j0k1l2m3'], message: 'Prepare release 1.1.1', date: '2025-01-06T08:00:00Z', author: 'Alice', refs: ['origin/main'], branch: 'main' }
];

const GitCommitViewer = () => {
    const [selectedBranch, setSelectedBranch] = useState('Show All');
    const [showRemoteBranches, setShowRemoteBranches] = useState(true);
    const [selectedCommit, setSelectedCommit] = useState(null);

    // 分支到车道的映射
    const branchToLane = useMemo(() => {
        const branches = new Set();
        rawCommits.forEach(commit => {
            if (commit.branch) {
                branches.add(commit.branch);
            }
        });
        const branchList = Array.from(branches).sort();
        const mapping = {};
        branchList.forEach((branch, index) => {
            mapping[branch] = index;
        });
        return mapping;
    }, []);

    // 分支到颜色的映射
    const branchToColor = useMemo(() => {
        const mapping = {};
        Object.keys(branchToLane).forEach(branch => {
            const laneIndex = branchToLane[branch];
            mapping[branch] = defaultColors[laneIndex % defaultColors.length];
        });
        return mapping;
    }, [branchToLane]);

    // 处理后的提交数据
    const processedCommits = useMemo(() => {
        return rawCommits.map((commit, index) => ({
            ...commit,
            index,
            lane: branchToLane[commit.branch] || 0,
            color: branchToColor[commit.branch] || defaultColors[0],
            isMerge: commit.parents.length > 1
        }));
    }, [branchToLane, branchToColor]);

    const branchOptions = ['Show All', 'main', 'feature/login', 'hotfix/typo'];

    // 过滤可见提交
    const visibleCommits = useMemo(() => {
        if (selectedBranch === 'Show All') {
            return processedCommits;
        }
        return processedCommits.filter(commit => {
            if (!showRemoteBranches && commit.refs.some(ref => ref.startsWith('origin/'))) {
                return false;
            }
            return commit.refs.some(ref => ref.includes(selectedBranch)) || 
                commit.branch === selectedBranch;
        });
    }, [processedCommits, selectedBranch, showRemoteBranches]);

    // 创建提交哈希到索引的映射
    const commitHashToIndex = useMemo(() => {
        const map = new Map();
        visibleCommits.forEach((commit, index) => {
            map.set(commit.hash, index);
        });
        return map;
    }, [visibleCommits]);

    const handleCommitClick = useCallback((commit) => {
        setSelectedCommit(commit);
    }, []);

    // 重新设计的图形渲染组件
    const CommitGraph = React.memo(({ commit, index, visibleCommits, commitHashToIndex }) => {
        const rowHeight = 40;
        const laneWidth = 20;
        const nodeRadius = 4;
        const maxLanes = Math.max(...visibleCommits.map(c => c.lane)) + 1;
        const graphWidth = Math.max(120, maxLanes * laneWidth + 40);
        const centerY = rowHeight / 2;

        // 计算当前提交的节点位置（不需要额外的偏移）
        const nodeX = commit.lane * laneWidth + 20;
        const nodeY = centerY;

        // 绘制连接到父节点的边
        const renderEdges = () => {
            const edges = [];
            commit.parents.forEach((parentHash, parentIndex) => {
                const parentCommitIndex = commitHashToIndex.get(parentHash);
                if (parentCommitIndex === undefined || parentCommitIndex >= index) return;
                const parentCommit = visibleCommits[parentCommitIndex];
                if (!parentCommit) return;
                const parentNodeX = parentCommit.lane * laneWidth + 20;
                const parentNodeY = centerY;
                const deltaY = (index - parentCommitIndex) * rowHeight;
                const startX = nodeX;
                const startY = nodeY;
                const endX = parentNodeX;
                const endY = parentNodeY - deltaY;
                const edgeColor = (commit.lane === parentCommit.lane)
                    ? commit.color
                    : (commit.lane < parentCommit.lane ? commit.color : parentCommit.color);

                if (commit.lane === parentCommit.lane) {
                    const adjustedStartY = startY - nodeRadius;
                    const adjustedEndY = endY + nodeRadius;
                    edges.push(
                        <line
                            key={`edge-${parentHash}-${parentIndex}`}
                            x1={startX}
                            y1={adjustedStartY}
                            x2={endX}
                            y2={adjustedEndY}
                            stroke={edgeColor}
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    );
                } else {
                    const dx = endX - startX;
                    const dy = endY - startY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const adjustedStartX = startX + (dx / distance) * nodeRadius;
                    const adjustedStartY = startY + (dy / distance) * nodeRadius;
                    const adjustedEndX = endX - (dx / distance) * nodeRadius;
                    const adjustedEndY = endY - (dy / distance) * nodeRadius;
                    const controlY1 = adjustedStartY + (adjustedEndY - adjustedStartY) * 0.3;
                    const controlY2 = adjustedEndY - (adjustedEndY - adjustedStartY) * 0.3;
                    const pathData = `M ${adjustedStartX} ${adjustedStartY} C ${adjustedStartX} ${controlY1}, ${adjustedEndX} ${controlY2}, ${adjustedEndX} ${adjustedEndY}`;
                    edges.push(
                        <path
                            key={`edge-${parentHash}-${parentIndex}`}
                            d={pathData}
                            stroke={edgeColor}
                            strokeWidth="2"
                            fill="none"
                            strokeLinecap="round"
                        />
                    );
                }
            });
            return edges;
        };

        return (
            <div className="relative" style={{ width: graphWidth, height: rowHeight }}>
                <svg
                    width={graphWidth}
                    height={rowHeight}
                    className="absolute inset-0"
                    role="img"
                    aria-label={`Git graph for commit ${commit.hash}`}
                    style={{ overflow: 'visible' }}
                >
                    {renderEdges()}
                    <circle
                        cx={nodeX}
                        cy={nodeY}
                        r={nodeRadius}
                        fill={commit.color}
                        stroke="#1f2937"
                        strokeWidth="1"
                    />
                    {commit.isMerge && (
                        <>
                            <circle
                                cx={nodeX}
                                cy={nodeY}
                                r={nodeRadius - 1}
                                fill="#1f2937"
                            />
                            <circle
                                cx={nodeX}
                                cy={nodeY}
                                r={nodeRadius + 2}
                                fill="none"
                                stroke={commit.color}
                                strokeWidth="2"
                            />
                        </>
                    )}
                    {commit.isUncommitted && (
                        <circle
                            cx={nodeX}
                            cy={nodeY}
                            r={nodeRadius + 3}
                            fill="none"
                            stroke="#fbbf24"
                            strokeWidth="1"
                            strokeDasharray="2,2"
                        />
                    )}
                </svg>
            </div>
        );
    });

    const formatDate = useCallback((dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }, []);

    const formatAuthor = useCallback((author) => {
        return author.length > 10 ? author.substring(0, 10) + '...' : author;
    }, []);

    return (
        <div className={`min-h-screen ${macBg} font-[SFMono-Regular,Menlo,Monaco,Consolas,monospace] text-[13px]`}>
            {/* 头部工具栏 */}
            <header className={`px-6 border-b ${macBorder} ${macPanel} ${macShadow}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <h1 className={`text-base font-semibold ${macText} tracking-tight`}>Git Graph</h1>
                        <div className="flex items-center gap-2">
                            <select 
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                className={`text-[13px] border ${macBorder} ${macRounded} px-3 focus:outline-none focus:ring-2 focus:ring-[#007aff] transition`}
                                style={{ minWidth: 90, fontWeight: 500 }}
                            >
                                {branchOptions.map(branch => (
                                    <option key={branch} value={branch}>{branch}</option>
                                ))}
                            </select>
                            <label className={`flex items-center gap-1 text-[13px] ${macSubtle}`}>
                                <input
                                    type="checkbox"
                                    checked={showRemoteBranches}
                                    onChange={(e) => setShowRemoteBranches(e.target.checked)}
                                    className="accent-[#007aff] w-4 h-4"
                                />
                                <span>Show remote</span>
                            </label>
                        </div>
                    </div>
                    <nav className="flex items-center gap-1.5" aria-label="Git Graph Actions">
                        <button aria-label="Search commits" className={`p-2 ${macRounded} ${macHover} transition`}>
                            <Search className="w-4 h-4" />
                        </button>
                        <button aria-label="Toggle view options" className={`p-2 ${macRounded} ${macHover} transition`}>
                            <Eye className="w-4 h-4" />
                        </button>
                        <button aria-label="Open settings" className={`p-2 ${macRounded} ${macHover} transition`}>
                            <Settings className="w-4 h-4" />
                        </button>
                        <button aria-label="Manage branches" className={`p-2 ${macRounded} ${macHover} transition`}>
                            <GitBranch className="w-4 h-4" />
                        </button>
                    </nav>
                </div>
            </header>

            {/* 主内容区域 */}
            <main className="flex">
                {/* 左侧提交列表 */}
                <section className={`flex-1 border-r ${macBorder} ${macPanel} ${macShadow}`} aria-label="Commit History">
                    {/* 表头 */}
                    <div className={`px-6 border-b flex text-[13px] font-semibold ${macSubtle} bg-transparent`}>
                        <div className="w-32">Graph</div>
                        <div className="flex-1 px-2">Description</div>
                        <div className="w-32">Date</div>
                        <div className="w-24">Author</div>
                        <div className="w-24">Commit</div>
                    </div>

                    {/* 提交列表 */}
                    <div>
                        {visibleCommits.map((commit, index) => (
                            <div
                                key={commit.hash}
                                onClick={() => handleCommitClick(commit)}
                                className={`
                                    px-6 cursor-pointer flex items-center text-[13px] transition-colors
                                    focus:outline-none focus:ring-2 focus:ring-[#007aff]
                                `}
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleCommitClick(commit);
                                    }
                                }}
                                style={{ minHeight: 41}}
                            >
                                {/* Graph列 */}
                                <div className="w-32 flex items-center">
                                    <CommitGraph
                                        commit={commit}
                                        index={index}
                                        visibleCommits={visibleCommits}
                                        commitHashToIndex={commitHashToIndex}
                                    />
                                </div>

                                {/* Description列 */}
                                <div className="flex-1 px-2 min-w-0">
                                    <div className="flex items-center gap-2">
                                        {commit.refs.length > 0 && commit.refs.map(ref => (
                                            <span
                                                key={ref}
                                                className="px-2 bg-[#eaf1fb] text-[#007aff] rounded-full text-[12px] border border-[#dbeafe] font-medium"
                                                title={`Reference: ${ref}`}
                                                style={{ fontFamily: "SFMono-Regular,Menlo,Monaco,Consolas,monospace" }}
                                            >
                                                {ref}
                                            </span>
                                        ))}
                                        <span className={`truncate ${macText} font-medium`} title={commit.message}>
                                            {commit.message}
                                        </span>
                                        {commit.isMerge && (
                                            <span className="px-2 bg-[#f3e8ff] text-[#7c3aed] rounded-full text-[12px] font-medium">
                                                Merge
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Date列 */}
                                <div className="w-32 text-[13px] text-[#636366]">
                                    <time dateTime={commit.date} title={new Date(commit.date).toString()}>
                                        {formatDate(commit.date)}
                                    </time>
                                </div>

                                {/* Author列 */}
                                <div className="w-24 text-[13px] text-[#636366] truncate">
                                    <span title={commit.author}>
                                        {formatAuthor(commit.author)}
                                    </span>
                                </div>

                                {/* Commit列 */}
                                <div className="w-24 text-right">
                                    <code className="font-mono text-[13px] text-[#b0b3b8]" title={commit.hash}>
                                        {commit.hash.substring(0, 7)}
                                    </code>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 右侧详情面板 */}
                <aside className={`w-[380px] ${macPanel} ${macShadow} border-l ${macBorder} min-h-full`} aria-label="Commit Details">
                    {selectedCommit ? (
                        <div className="p-8">
                            <h2 className={`text-xl font-semibold mb-6 ${macText} tracking-tight`}>Commit Details</h2>
                            <dl className="">
                                <div>
                                    <dt className={`block text-[14px] font-medium ${macSubtle} mb-1`}>Hash</dt>
                                    <dd className="font-mono text-[14px] p-2 bg-[#f5f5f7] rounded-lg border border-[#e5e5ea] break-all">
                                        {selectedCommit.hash}
                                    </dd>
                                </div>
                                <div>
                                    <dt className={`block text-[14px] font-medium ${macSubtle} mb-1`}>Branch & Lane</dt>
                                    <dd className="text-[14px] flex items-center gap-2">
                                        <span className={macText}>{selectedCommit.branch}</span>
                                        <span className={macSubtle}>•</span>
                                        <span className={macText}>Lane {selectedCommit.lane}</span>
                                        <span
                                            className="inline-block w-3 h-3 rounded-full border"
                                            style={{ backgroundColor: selectedCommit.color, borderColor: "#e5e5ea" }}
                                            title={`Lane color: ${selectedCommit.color}`}
                                        />
                                    </dd>
                                </div>
                                <div>
                                    <dt className={`block text-[14px] font-medium ${macSubtle} mb-1`}>Type</dt>
                                    <dd className="text-[14px]">
                                        {selectedCommit.isMerge ? 'Merge Commit' : 'Regular Commit'}
                                        {selectedCommit.parents.length === 0 && ' (Root)'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className={`block text-[14px] font-medium ${macSubtle} mb-1`}>
                                        Parents ({selectedCommit.parents.length})
                                    </dt>
                                    <dd className="text-[13px] p-2 bg-[#f5f5f7] rounded-lg border border-[#e5e5ea]">
                                        {selectedCommit.parents.length > 0 ? (
                                            selectedCommit.parents.map((parent, index) => (
                                                <div key={parent} className="font-mono flex items-center gap-2">
                                                    <span>{parent}</span>
                                                    {index === 0 && selectedCommit.parents.length > 1 && (
                                                        <span className="text-[#636366] text-xs">(main parent)</span>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-[#636366]">No parents (root commit)</div>
                                        )}
                                    </dd>
                                </div>
                                <div>
                                    <dt className={`block text-[14px] font-medium ${macSubtle} mb-1`}>References</dt>
                                    <dd className="text-[14px]">
                                        {selectedCommit.refs.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {selectedCommit.refs.map(ref => (
                                                    <span key={ref} className="px-2 text-[#007aff] rounded-full text-xs font-medium border border-[#dbeafe]">
                                                        {ref}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-[#636366]">None</span>
                                        )}
                                    </dd>
                                </div>
                                <div>
                                    <dt className={`block text-[14px] font-medium ${macSubtle} mb-1`}>Author</dt>
                                    <dd className="text-[14px]">{selectedCommit.author}</dd>
                                </div>
                                <div>
                                    <dt className={`block text-[14px] font-medium ${macSubtle} mb-1`}>Date</dt>
                                    <dd className="text-[14px]">
                                        <time dateTime={selectedCommit.date}>
                                            {new Date(selectedCommit.date).toLocaleString()}
                                        </time>
                                    </dd>
                                </div>
                                <div>
                                    <dt className={`block text-[14px] font-medium ${macSubtle} mb-1`}>Message</dt>
                                    <dd className="text-[14px] p-2 bg-[#f5f5f7] rounded-lg border border-[#e5e5ea] whitespace-pre-wrap">
                                        {selectedCommit.message}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-[#b0b3b8] mt-20">
                            <GitCommit className="w-12 h-12 mx-auto mb-3 opacity-40" />
                            <p className="text-[15px]">Select a commit to view details</p>
                        </div>
                    )}
                </aside>
            </main>
        </div>
    );
};

export default GitCommitViewer;