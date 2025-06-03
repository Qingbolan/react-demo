/**
 * -----------------------------------------------------------------------------
 * Multi-Agent Collaboration Visualization - Architectural Overview
 * -----------------------------------------------------------------------------
 * 
 * Author: Silan Hu
 * Date: May 27, 2025
 * 
 * -----------------------------------------------------------------------------
 * Purpose:
 * --------
 * This document outlines the core architectural principles, design decisions,
 * and implementation strategies for the multi-agent collaboration visualization 
 * component. The goal is to deliver a robust, maintainable, and visually clear
 * representation of agent task responses and collaboration workflows, supporting 
 * complex multi-agent scenarios with enterprise-grade performance and accessibility.
 * 
 * -----------------------------------------------------------------------------
 * 1. Node Positioning Strategy
 * -----------------------------------------------------------------------------
 * - Each task response is rendered as a node (circle) on its assigned agent lane.
 * - Lane assignment is determined by agent name, ensuring consistent
 *   horizontal positioning across the graph.
 * - Node coordinates are calculated as follows:
 *     const nodeX = response.lane * laneWidth + offsetX;
 *     const nodeY = centerY; // Vertically centered within its row.
 * 
 * -----------------------------------------------------------------------------
 * 2. Edge Rendering Strategy
 * -----------------------------------------------------------------------------
 * - Edges visually connect dependent task responses.
 * - Each response may depend on multiple previous responses (to support collaboration).
 * - Edge color is inherited from the child node's agent color to maintain
 *   visual consistency and workflow traceability.
 * 
 * -----------------------------------------------------------------------------
 * 3. Connection Types and Rendering Logic
 * -----------------------------------------------------------------------------
 * - Same Agent (Straight Line):
 *     - If child and parent responses are from the same agent (lane), render a 
 *       straight vertical line between the edges of the two nodes.
 *     - Start/end points are offset by node radius to avoid overlap.
 *     Example:
 *         if (child.lane === parent.lane) {
 *             const startY = childNodeY - nodeRadius;
 *             const endY = parentNodeY + nodeRadius;
 *             // Render straight line
 *         }
 * 
 * - Cross-Agent (Curved Line):
 *     - If child and parent responses are from different agents, render a smooth 
 *       Bézier curve between the nodes to show collaboration.
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
 * - Step 2: Render all task response nodes (circles) on top of the edges.
 *   This ensures nodes are visually prominent and not obscured by edges.
 * 
 * -----------------------------------------------------------------------------
 * 5. Key Design Decisions
 * -----------------------------------------------------------------------------
 * - Lane Lines Omitted:
 *     - Lane lines are intentionally omitted to reduce visual clutter.
 *     - Connecting edges provide sufficient visual guidance for collaboration flow.
 * 
 * - Edge-to-Edge Connections:
 *     - All edges connect precisely at the circumference of nodes, not through
 *       their centers, for improved clarity and aesthetics.
 *     - Vector mathematics is used to calculate intersection points.
 * 
 * - Color Inheritance:
 *     - Edge color always matches the child (source) node's agent color.
 *     - This approach enhances collaboration traceability and visual coherence.
 * 
 * -----------------------------------------------------------------------------
 * 6. Performance Optimizations
 * -----------------------------------------------------------------------------
 * - Component Memoization:
 *     - React.memo is used for graph components to prevent unnecessary
 *       re-renders, improving performance in large collaboration workflows.
 *     Example:
 *         const ResponseGraph = React.memo(({ response, index, visibleResponses }) => { ... });
 * 
 * - Efficient Data Structures:
 *     - Hash maps are used for O(1) response lookups during edge rendering.
 *     Example:
 *         const responseIdToIndex = useMemo(() => {
 *             const map = new Map();
 *             visibleResponses.forEach((response, index) => map.set(response.id, index));
 *             return map;
 *         }, [visibleResponses]);
 * 
 * -----------------------------------------------------------------------------
 * 7. Accessibility Considerations
 * -----------------------------------------------------------------------------
 * - Semantic HTML: All SVG and interactive elements use appropriate ARIA roles
 *   and labels for screen reader compatibility.
 * - Keyboard Navigation: Full support for keyboard-based response selection and
 *   navigation (Tab, Enter, Space).
 * - Screen Reader Support: Descriptive alt text and ARIA attributes are
 *   provided for all graph elements.
 * - High Contrast: All agent colors are selected to ensure sufficient
 *   contrast for users with visual impairments.
 * 
 * -----------------------------------------------------------------------------
 * 8. Technical Challenges Addressed
 * -----------------------------------------------------------------------------
 * - SVG/Container Alignment:
 *     - SVG coordinates are aligned with the container using absolute
 *       positioning and removal of conflicting CSS.
 * 
 * - Multi-Dependency Handling:
 *     - The implementation supports responses with multiple dependencies by
 *       iterating through all dependency relationships and rendering individual
 *       edges for each.
 * 
 * - Visual Clarity in Complex Collaboration:
 *     - By omitting lane lines and focusing on essential connections, the
 *       graph remains readable even in complex multi-agent scenarios.
 * 
 * -----------------------------------------------------------------------------
 * 9. Future Enhancements (Planned)
 * -----------------------------------------------------------------------------
 * - Interactive Features: Hover effects, zoom/pan capabilities.
 * - Animation: Smooth transitions for agent filtering and graph updates.
 * - Customization: User-configurable agent colors and layout spacing.
 * - Performance: Virtual scrolling and incremental rendering for very large
 *   collaboration workflows.
 * - Real-time Updates: Live collaboration monitoring and status updates.
 * 
 * -----------------------------------------------------------------------------
 * Summary:
 * --------
 * This multi-agent collaboration visualization component is engineered for 
 * clarity, performance, and accessibility. It accurately represents complex 
 * agent workflows, including task dependencies and collaboration patterns, 
 * while maintaining a clean and modern visual style suitable for enterprise 
 * multi-agent systems.
 * -----------------------------------------------------------------------------
 */


import React, { useState, useMemo, useCallback } from 'react';
import { Users, Eye, Settings, Search, Zap, Brain, MessageSquare } from 'lucide-react';

// 苹果风格简约配色
const macBg = "bg-[#f5f5f7]";
const macPanel = "bg-white";
const macBorder = "border-[#e5e5ea]";
const macText = "text-[#1c1c1e]";
const macSubtle = "text-[#6e6e73]";
const macHover = "hover:bg-[#e5e5ea]";
const macShadow = "shadow-[0_1px_4px_0_rgba(60,60,67,0.03)]";
const macRounded = "rounded-[12px]";

// Multi-Agent System color palette - distinct colors for different agent types
export const defaultColors = [
    '#0085d9', // Blue - Data Analyst Agent
    '#d9008f', // Pink - UI/UX Designer Agent  
    '#00d90a', // Green - Backend Developer Agent
    '#d98500', // Orange - Frontend Developer Agent
    '#a300d9', // Purple - QA Testing Agent
    '#ff0000', // Red - Security Audit Agent
    '#00d9cc', // Cyan - DevOps Agent
    '#e138e8', // Magenta - Product Manager Agent
    '#85d900', // Lime - Documentation Agent
    '#dc5b23'  // Brown - Code Review Agent
];

// 示例多智能体协作数据 - 基于用户需求主线的分支架构
export const rawTaskResponses = [
    // 用户需求主线 (Main User Requirements Line)
    { 
        id: 'req_001', 
        dependencies: [], 
        requirement: '[USER REQUEST] Build a secure user authentication system for the web application', 
        timestamp: '2025-01-01T09:00:00Z', 
        agent: 'User', 
        status: ['main', 'user-requirement'], 
        agentType: 'user',
        priority: 'critical',
        estimatedTime: 'N/A',
        isUserRequirement: true
    },
    { 
        id: 'req_002', 
        dependencies: ['req_001'], 
        requirement: '[USER REQUEST] System should support social login (Google, GitHub) and traditional email/password', 
        timestamp: '2025-01-01T10:00:00Z', 
        agent: 'User', 
        status: ['main', 'user-requirement'], 
        agentType: 'user',
        priority: 'high',
        estimatedTime: 'N/A',
        isUserRequirement: true
    },
    { 
        id: 'req_003', 
        dependencies: ['req_002'], 
        requirement: '[USER REQUEST] Add password reset functionality and email verification', 
        timestamp: '2025-01-01T11:00:00Z', 
        agent: 'User', 
        status: ['main', 'user-requirement'], 
        agentType: 'user',
        priority: 'medium',
        estimatedTime: 'N/A',
        isUserRequirement: true
    },
    { 
        id: 'req_004', 
        dependencies: ['req_003'], 
        requirement: '[USER REQUEST] Ensure responsive design and mobile-friendly interface', 
        timestamp: '2025-01-01T12:00:00Z', 
        agent: 'User', 
        status: ['main', 'user-requirement'], 
        agentType: 'user',
        priority: 'high',
        estimatedTime: 'N/A',
        isUserRequirement: true
    },
    { 
        id: 'req_005', 
        dependencies: ['req_004'], 
        requirement: '[USER REQUEST] Deploy to production with proper security measures', 
        timestamp: '2025-01-01T13:00:00Z', 
        agent: 'User', 
        status: ['main', 'user-requirement'], 
        agentType: 'user',
        priority: 'critical',
        estimatedTime: 'N/A',
        isUserRequirement: true
    },

    // DevOps Agent 分支 - 基础设施和部署
    { 
        id: 'devops_001', 
        dependencies: ['req_001'], 
        requirement: 'Setup development environment and project structure', 
        timestamp: '2025-01-02T09:00:00Z', 
        agent: 'DevOps Agent', 
        status: ['branch/devops-setup'], 
        agentType: 'devops',
        priority: 'high',
        estimatedTime: '2h'
    },
    { 
        id: 'devops_002', 
        dependencies: ['devops_001'], 
        requirement: 'Configure CI/CD pipeline for automated testing and deployment', 
        timestamp: '2025-01-02T14:00:00Z', 
        agent: 'DevOps Agent', 
        status: ['branch/devops-setup'], 
        agentType: 'devops',
        priority: 'high',
        estimatedTime: '4h'
    },

    // Backend Developer 分支 - API和数据库
    { 
        id: 'backend_001', 
        dependencies: ['req_001'], 
        requirement: 'Design authentication system architecture and database schema', 
        timestamp: '2025-01-02T10:00:00Z', 
        agent: 'Backend Developer', 
        status: ['branch/auth-backend'], 
        agentType: 'backend',
        priority: 'critical',
        estimatedTime: '6h'
    },
    { 
        id: 'backend_002', 
        dependencies: ['backend_001', 'req_002'], 
        requirement: 'Implement OAuth2 integration for Google and GitHub social login', 
        timestamp: '2025-01-03T09:00:00Z', 
        agent: 'Backend Developer', 
        status: ['branch/auth-backend'], 
        agentType: 'backend',
        priority: 'high',
        estimatedTime: '8h'
    },
    { 
        id: 'backend_003', 
        dependencies: ['backend_002', 'req_003'], 
        requirement: 'Build password reset and email verification services', 
        timestamp: '2025-01-04T10:00:00Z', 
        agent: 'Backend Developer', 
        status: ['branch/auth-backend'], 
        agentType: 'backend',
        priority: 'medium',
        estimatedTime: '5h'
    },

    // UI/UX Designer 分支 - 用户界面设计
    { 
        id: 'design_001', 
        dependencies: ['req_001'], 
        requirement: 'Create user authentication flow wireframes and mockups', 
        timestamp: '2025-01-02T11:00:00Z', 
        agent: 'UI/UX Designer', 
        status: ['branch/ui-design'], 
        agentType: 'design',
        priority: 'high',
        estimatedTime: '4h'
    },
    { 
        id: 'design_002', 
        dependencies: ['design_001', 'req_004'], 
        requirement: 'Design responsive login/register forms with mobile optimization', 
        timestamp: '2025-01-03T11:00:00Z', 
        agent: 'UI/UX Designer', 
        status: ['branch/ui-design'], 
        agentType: 'design',
        priority: 'high',
        estimatedTime: '6h'
    },

    // Frontend Developer 分支 - 前端实现
    { 
        id: 'frontend_001', 
        dependencies: ['design_002'], 
        requirement: 'Implement responsive authentication UI components with React', 
        timestamp: '2025-01-04T09:00:00Z', 
        agent: 'Frontend Developer', 
        status: ['branch/frontend-auth'], 
        agentType: 'frontend',
        priority: 'high',
        estimatedTime: '8h'
    },
    { 
        id: 'frontend_002', 
        dependencies: ['frontend_001', 'backend_002'], 
        requirement: 'Integrate frontend with OAuth2 social login APIs', 
        timestamp: '2025-01-05T10:00:00Z', 
        agent: 'Frontend Developer', 
        status: ['branch/frontend-auth'], 
        agentType: 'frontend',
        priority: 'high',
        estimatedTime: '4h'
    },

    // Security Agent 分支 - 安全审计
    { 
        id: 'security_001', 
        dependencies: ['backend_003'], 
        requirement: 'Perform comprehensive security audit on authentication system', 
        timestamp: '2025-01-05T14:00:00Z', 
        agent: 'Security Audit Agent', 
        status: ['branch/security-audit'], 
        agentType: 'security',
        priority: 'critical',
        estimatedTime: '6h'
    },
    { 
        id: 'security_002', 
        dependencies: ['security_001'], 
        requirement: 'Fix identified security vulnerabilities and implement additional safeguards', 
        timestamp: '2025-01-06T09:00:00Z', 
        agent: 'Security Audit Agent', 
        status: ['branch/security-fixes'], 
        agentType: 'security',
        priority: 'critical',
        estimatedTime: '4h'
    },

    // 集成和部署 - 回到主线
    { 
        id: 'integration_001', 
        dependencies: ['frontend_002', 'security_002', 'devops_002'], 
        requirement: 'INTEGRATION: Merge all authentication components and prepare for testing', 
        timestamp: '2025-01-07T09:00:00Z', 
        agent: 'DevOps Agent', 
        status: ['main', 'integration'], 
        agentType: 'devops',
        priority: 'critical',
        estimatedTime: '3h',
        isIntegration: true
    },
    { 
        id: 'final_001', 
        dependencies: ['integration_001', 'req_005'], 
        requirement: 'DEPLOYMENT: Deploy complete authentication system to production', 
        timestamp: '2025-01-08T10:00:00Z', 
        agent: 'DevOps Agent', 
        status: ['main', 'deployment'], 
        agentType: 'devops',
        priority: 'critical',
        estimatedTime: '2h',
        isDeployment: true
    }
];

const MultiAgentCollaborationViewer = () => {
    const [selectedAgent, setSelectedAgent] = useState('Show All');
    const [showCompletedTasks, setShowCompletedTasks] = useState(true);
    const [selectedResponse, setSelectedResponse] = useState(null);

    // 智能体到车道的映射
    const agentToLane = useMemo(() => {
        const agents = new Set();
        rawTaskResponses.forEach(response => {
            if (response.agent) {
                agents.add(response.agent);
            }
        });
        const agentList = Array.from(agents).sort();
        const mapping = {};
        agentList.forEach((agent, index) => {
            mapping[agent] = index;
        });
        return mapping;
    }, []);

    // 智能体到颜色的映射
    const agentToColor = useMemo(() => {
        const mapping = {};
        Object.keys(agentToLane).forEach(agent => {
            const laneIndex = agentToLane[agent];
            mapping[agent] = defaultColors[laneIndex % defaultColors.length];
        });
        return mapping;
    }, [agentToLane]);

    // 处理后的任务响应数据
    const processedResponses = useMemo(() => {
        return rawTaskResponses.map((response, index) => ({
            ...response,
            index,
            lane: agentToLane[response.agent] || 0,
            color: agentToColor[response.agent] || defaultColors[0],
            isCollaboration: response.dependencies.length > 1
        }));
    }, [agentToLane, agentToColor]);

    const agentOptions = ['Show All', 'User', 'DevOps Agent', 'Backend Developer', 'UI/UX Designer', 'Frontend Developer', 'Security Audit Agent'];

    // 过滤可见任务响应
    const visibleResponses = useMemo(() => {
        if (selectedAgent === 'Show All') {
            return processedResponses;
        }
        return processedResponses.filter(response => {
            if (!showCompletedTasks && response.status.includes('completed')) {
                return false;
            }
            return response.status.some(status => status.includes(selectedAgent.toLowerCase().replace(' ', '-'))) || 
                response.agent === selectedAgent;
        });
    }, [processedResponses, selectedAgent, showCompletedTasks]);

    // 创建任务响应ID到索引的映射
    const responseIdToIndex = useMemo(() => {
        const map = new Map();
        visibleResponses.forEach((response, index) => {
            map.set(response.id, index);
        });
        return map;
    }, [visibleResponses]);

    const handleResponseClick = useCallback((response) => {
        setSelectedResponse(response);
    }, []);

    // Agent icon mapping
    const getAgentIcon = (agentType, response = null) => {
        // 特殊任务类型的图标
        if (response?.isUserRequirement) return '👤';
        if (response?.isIntegration) return '🔄';
        if (response?.isDeployment) return '🚀';
        
        const iconMap = {
            'user': '👤',
            'devops': '🔧',
            'backend': '⚙️',
            'frontend': '🎨',
            'design': '✨',
            'docs': '📝',
            'security': '🔒',
            'product': '📋',
            'qa': '🧪'
        };
        return iconMap[agentType] || '🤖';
    };

    // Priority color mapping
    const getPriorityColor = (priority) => {
        const colorMap = {
            'critical': 'bg-red-100 text-red-800 border-red-200',
            'high': 'bg-orange-100 text-orange-800 border-orange-200',
            'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'low': 'bg-blue-100 text-blue-800 border-blue-200'
        };
        return colorMap[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    // 计算图形宽度
    const maxLanes = useMemo(() => {
        return Math.max(...visibleResponses.map(r => r.lane)) + 1;
    }, [visibleResponses]);
    
    const graphWidth = useMemo(() => {
        const laneWidth = 20;
        return Math.max(140, maxLanes * laneWidth + 60);
    }, [maxLanes]);

    // 重新设计的图形渲染组件
    const ResponseGraph = React.memo(({ response, index, visibleResponses, responseIdToIndex }) => {
        const rowHeight = 40;
        const laneWidth = 20;
        const nodeRadius = 4;
        const centerY = rowHeight / 2;

        // 计算当前响应的节点位置
        const nodeX = response.lane * laneWidth + 20;
        const nodeY = centerY;

        // 绘制连接到依赖任务的边
        const renderEdges = () => {
            const edges = [];
            response.dependencies.forEach((dependencyId, depIndex) => {
                const dependencyResponseIndex = responseIdToIndex.get(dependencyId);
                if (dependencyResponseIndex === undefined || dependencyResponseIndex >= index) return;
                const dependencyResponse = visibleResponses[dependencyResponseIndex];
                if (!dependencyResponse) return;
                const dependencyNodeX = dependencyResponse.lane * laneWidth + 20;
                const dependencyNodeY = centerY;
                const deltaY = (index - dependencyResponseIndex) * rowHeight;
                const startX = nodeX;
                const startY = nodeY;
                const endX = dependencyNodeX;
                const endY = dependencyNodeY - deltaY;
                const edgeColor = (response.lane === dependencyResponse.lane)
                    ? response.color
                    : (response.lane < dependencyResponse.lane ? response.color : dependencyResponse.color);

                if (response.lane === dependencyResponse.lane) {
                    const adjustedStartY = startY - nodeRadius;
                    const adjustedEndY = endY + nodeRadius;
                    edges.push(
                        <line
                            key={`edge-${dependencyId}-${depIndex}`}
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
                            key={`edge-${dependencyId}-${depIndex}`}
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
            <div className="relative" style={{ width: '100%', height: rowHeight }}>
                <svg
                    width="100%"
                    height={rowHeight}
                    className="absolute inset-0"
                    role="img"
                    aria-label={`Task response graph for ${response.id}`}
                    style={{ overflow: 'visible' }}
                >
                    {renderEdges()}
                    <circle
                        cx={nodeX}
                        cy={nodeY}
                        r={nodeRadius}
                        fill={response.color}
                        stroke={response.isUserRequirement ? "#ff6b35" : "#1f2937"}
                        strokeWidth={response.isUserRequirement ? "2" : "1"}
                    />
                    {/* 用户需求节点的特殊标识 */}
                    {response.isUserRequirement && (
                        <>
                            <circle
                                cx={nodeX}
                                cy={nodeY}
                                r={nodeRadius + 3}
                                fill="none"
                                stroke="#ff6b35"
                                strokeWidth="2"
                            />
                            <circle
                                cx={nodeX}
                                cy={nodeY}
                                r={nodeRadius + 6}
                                fill="none"
                                stroke="#ff6b35"
                                strokeWidth="1"
                                strokeDasharray="3,3"
                            />
                        </>
                    )}
                    {/* 集成节点的特殊标识 */}
                    {response.isIntegration && (
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
                                stroke="#10b981"
                                strokeWidth="2"
                            />
                        </>
                    )}
                    {/* 部署节点的特殊标识 */}
                    {response.isDeployment && (
                        <>
                            <circle
                                cx={nodeX}
                                cy={nodeY}
                                r={nodeRadius + 2}
                                fill="none"
                                stroke="#8b5cf6"
                                strokeWidth="2"
                            />
                            <circle
                                cx={nodeX}
                                cy={nodeY}
                                r={nodeRadius + 4}
                                fill="none"
                                stroke="#8b5cf6"
                                strokeWidth="1"
                                strokeDasharray="2,2"
                            />
                        </>
                    )}
                    {response.isCollaboration && !response.isIntegration && (
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
                                stroke={response.color}
                                strokeWidth="2"
                            />
                        </>
                    )}
                    {response.priority === 'critical' && !response.isUserRequirement && (
                        <circle
                            cx={nodeX}
                            cy={nodeY}
                            r={nodeRadius + 3}
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="1"
                            strokeDasharray="2,2"
                        />
                    )}
                </svg>
            </div>
        );
    });

    const formatTimestamp = useCallback((timestampStr) => {
        const date = new Date(timestampStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }, []);

    const formatAgent = useCallback((agent) => {
        return agent.length > 12 ? agent.substring(0, 12) + '...' : agent;
    }, []);

    return (
        <div className={`min-h-screen ${macBg} font-[SFMono-Regular,Menlo,Monaco,Consolas,monospace] text-[13px]`}>
            {/* 头部工具栏 */}
            <header className={`px-6 border-b ${macBorder} ${macPanel} ${macShadow}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <h1 className={`text-base font-semibold ${macText} tracking-tight flex items-center gap-2`}>
                            <Users className="w-5 h-5 text-[#007aff]" />
                            Multi-Agent Collaboration
                        </h1>
                        <div className="flex items-center gap-2">
                            <select 
                                value={selectedAgent}
                                onChange={(e) => setSelectedAgent(e.target.value)}
                                className={`text-[13px] border ${macBorder} ${macRounded} px-3 focus:outline-none focus:ring-2 focus:ring-[#007aff] transition`}
                                style={{ minWidth: 120, fontWeight: 500 }}
                            >
                                {agentOptions.map(agent => (
                                    <option key={agent} value={agent}>{agent}</option>
                                ))}
                            </select>
                            <label className={`flex items-center gap-1 text-[13px] ${macSubtle}`}>
                                <input
                                    type="checkbox"
                                    checked={showCompletedTasks}
                                    onChange={(e) => setShowCompletedTasks(e.target.checked)}
                                    className="accent-[#007aff] w-4 h-4"
                                />
                                <span>Show completed</span>
                            </label>
                        </div>
                    </div>
                    <nav className="flex items-center gap-1.5" aria-label="Collaboration Actions">
                        <button aria-label="Search tasks" className={`p-2 ${macRounded} ${macHover} transition`}>
                            <Search className="w-4 h-4" />
                        </button>
                        <button aria-label="Toggle view options" className={`p-2 ${macRounded} ${macHover} transition`}>
                            <Eye className="w-4 h-4" />
                        </button>
                        <button aria-label="Open settings" className={`p-2 ${macRounded} ${macHover} transition`}>
                            <Settings className="w-4 h-4" />
                        </button>
                        <button aria-label="Manage agents" className={`p-2 ${macRounded} ${macHover} transition`}>
                            <Brain className="w-4 h-4" />
                        </button>
                    </nav>
                </div>
            </header>

            {/* 主内容区域 */}
            <main className="flex">
                {/* 左侧任务响应列表 */}
                <section className={`flex-1 border-r ${macBorder} ${macPanel} ${macShadow}`} aria-label="Task Response History">
                    {/* 表头 */}
                    <div className={`px-6 border-b flex text-[13px] font-semibold ${macSubtle} bg-transparent`}>
                        <div style={{ width: graphWidth }}>Flow</div>
                        <div className="flex-1 px-2">Requirement & Goal</div>
                        <div className="w-32">Timestamp</div>
                        <div className="w-28">Agent</div>
                        <div className="w-20">Task ID</div>
                    </div>

                    {/* 任务响应列表 */}
                    <div>
                        {visibleResponses.map((response, index) => (
                            <div
                                key={response.id}
                                onClick={() => handleResponseClick(response)}
                                className={`
                                    px-6 cursor-pointer flex items-center text-[13px] transition-colors
                                    focus:outline-none focus:ring-2 focus:ring-[#007aff]
                                `}
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleResponseClick(response);
                                    }
                                }}
                                style={{ minHeight: 41}}
                            >
                                {/* Flow列 */}
                                <div className="flex items-center" style={{ width: graphWidth }}>
                                    <ResponseGraph
                                        response={response}
                                        index={index}
                                        visibleResponses={visibleResponses}
                                        responseIdToIndex={responseIdToIndex}
                                    />
                                </div>

                                {/* Requirement & Goal列 */}
                                <div className="flex-1 px-2 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm" title={`Agent: ${response.agent}`}>
                                            {getAgentIcon(response.agentType, response)}
                                        </span>
                                        {response.status.length > 0 && response.status.map(status => (
                                            <span
                                                key={status}
                                                className="px-2 bg-[#eaf1fb] text-[#007aff] rounded-full text-[12px] border border-[#dbeafe] font-medium"
                                                title={`Status: ${status}`}
                                                style={{ fontFamily: "SFMono-Regular,Menlo,Monaco,Consolas,monospace" }}
                                            >
                                                {status}
                                            </span>
                                        ))}
                                        <span
                                            className={`px-2 rounded-full text-[12px] font-medium border ${getPriorityColor(response.priority)}`}
                                            title={`Priority: ${response.priority}`}
                                        >
                                            {response.priority}
                                        </span>
                                        <span className={`truncate ${macText} font-medium`} title={response.requirement}>
                                            {response.requirement}
                                        </span>
                                        {response.isUserRequirement && (
                                            <span className="px-2 bg-[#fff5f0] text-[#ff6b35] rounded-full text-[12px] font-medium border border-[#ff6b35]">
                                                USER REQ
                                            </span>
                                        )}
                                        {response.isIntegration && (
                                            <span className="px-2 bg-[#f0fdf4] text-[#10b981] rounded-full text-[12px] font-medium border border-[#10b981]">
                                                INTEGRATION
                                            </span>
                                        )}
                                        {response.isDeployment && (
                                            <span className="px-2 bg-[#f5f3ff] text-[#8b5cf6] rounded-full text-[12px] font-medium border border-[#8b5cf6]">
                                                DEPLOYMENT
                                            </span>
                                        )}
                                        {response.isCollaboration && !response.isIntegration && (
                                            <span className="px-2 bg-[#f3e8ff] text-[#7c3aed] rounded-full text-[12px] font-medium">
                                                Collaboration
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Timestamp列 */}
                                <div className="w-32 text-[13px] text-[#636366]">
                                    <time dateTime={response.timestamp} title={new Date(response.timestamp).toString()}>
                                        {formatTimestamp(response.timestamp)}
                                    </time>
                                </div>

                                {/* Agent列 */}
                                <div className="w-28 text-[13px] text-[#636366] truncate">
                                    <span title={response.agent}>
                                        {formatAgent(response.agent)}
                                    </span>
                                </div>

                                {/* Task ID列 */}
                                <div className="w-20 text-right">
                                    <code className="font-mono text-[13px] text-[#b0b3b8]" title={response.id}>
                                        {response.id.replace('task_', '')}
                                    </code>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 右侧详情面板 */}
                <aside className={`w-[380px] ${macPanel} ${macShadow} border-l ${macBorder} min-h-full`} aria-label="Task Response Details">
                    {selectedResponse ? (
                        <div className="p-8">
                            <h2 className={`text-xl font-semibold mb-6 ${macText} tracking-tight flex items-center gap-2`}>
                                <Zap className="w-5 h-5 text-[#007aff]" />
                                Task Response Details
                            </h2>
                            <dl className="">
                                <div>
                                    <dt className={`block text-[14px] font-medium ${macSubtle} mb-1`}>Task ID</dt>
                                    <dd className="font-mono text-[14px] p-2 bg-[#f5f5f7] rounded-lg border border-[#e5e5ea] break-all">
                                        {selectedResponse.id}
                                    </dd>
                                </div>
                                <div>
                                    <dt className={`block text-[14px] font-medium ${macSubtle} mb-1`}>Agent & Lane</dt>
                                    <dd className="text-[14px] flex items-center gap-2">
                                        <span className="text-lg">{getAgentIcon(selectedResponse.agentType, selectedResponse)}</span>
                                        <span className={macText}>{selectedResponse.agent}</span>
                                        <span className={macSubtle}>•</span>
                                        <span className={macText}>Lane {selectedResponse.lane}</span>
                                        <span
                                            className="inline-block w-3 h-3 rounded-full border"
                                            style={{ backgroundColor: selectedResponse.color, borderColor: "#e5e5ea" }}
                                            title={`Agent color: ${selectedResponse.color}`}
                                        />
                                    </dd>
                                </div>
                                <div>
                                    <dt className={`block text-[14px] font-medium ${macSubtle} mb-1`}>Task Type & Priority</dt>
                                    <dd className="text-[14px] flex items-center gap-2 flex-wrap">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getPriorityColor(selectedResponse.priority)}`}>
                                            {selectedResponse.priority.toUpperCase()}
                                        </span>
                                        {selectedResponse.isUserRequirement && (
                                            <span className="px-2 py-1 bg-[#fff5f0] text-[#ff6b35] rounded-lg text-xs font-medium border border-[#ff6b35]">
                                                USER REQUIREMENT
                                            </span>
                                        )}
                                        {selectedResponse.isIntegration && (
                                            <span className="px-2 py-1 bg-[#f0fdf4] text-[#10b981] rounded-lg text-xs font-medium border border-[#10b981]">
                                                INTEGRATION TASK
                                            </span>
                                        )}
                                        {selectedResponse.isDeployment && (
                                            <span className="px-2 py-1 bg-[#f5f3ff] text-[#8b5cf6] rounded-lg text-xs font-medium border border-[#8b5cf6]">
                                                DEPLOYMENT TASK
                                            </span>
                                        )}
                                        {!selectedResponse.isUserRequirement && !selectedResponse.isIntegration && !selectedResponse.isDeployment && (
                                            <span>
                                                {selectedResponse.isCollaboration ? 'Collaboration Task' : 'Individual Task'}
                                            </span>
                                        )}
                                        {selectedResponse.dependencies.length === 0 && (
                                            <span className="text-xs text-[#636366]">(Root Task)</span>
                                        )}
                                    </dd>
                                </div>
                                <div>
                                    <dt className={`block text-[14px] font-medium ${macSubtle} mb-1`}>
                                        Dependencies ({selectedResponse.dependencies.length})
                                    </dt>
                                    <dd className="text-[13px] p-2 bg-[#f5f5f7] rounded-lg border border-[#e5e5ea]">
                                        {selectedResponse.dependencies.length > 0 ? (
                                            selectedResponse.dependencies.map((depId, index) => (
                                                <div key={depId} className="font-mono flex items-center gap-2">
                                                    <span>{depId}</span>
                                                    {index === 0 && selectedResponse.dependencies.length > 1 && (
                                                        <span className="text-[#636366] text-xs">(primary dependency)</span>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-[#636366]">No dependencies (root task)</div>
                                        )}
                                    </dd>
                                </div>
                                <div>
                                    <dt className={`block text-[14px] font-medium ${macSubtle} mb-1`}>Status & Workflow</dt>
                                    <dd className="text-[14px]">
                                        {selectedResponse.status.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {selectedResponse.status.map(status => (
                                                    <span key={status} className="px-2 text-[#007aff] rounded-full text-xs font-medium border border-[#dbeafe]">
                                                        {status}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-[#636366]">No status</span>
                                        )}
                                    </dd>
                                </div>
                                <div>
                                    <dt className={`block text-[14px] font-medium ${macSubtle} mb-1`}>Estimated Time</dt>
                                    <dd className="text-[14px] flex items-center gap-2">
                                        <span className={macText}>{selectedResponse.estimatedTime}</span>
                                        <span className="text-xs text-[#636366]">estimated completion time</span>
                                    </dd>
                                </div>
                                <div>
                                    <dt className={`block text-[14px] font-medium ${macSubtle} mb-1`}>Agent Type</dt>
                                    <dd className="text-[14px] flex items-center gap-2">
                                        <span>{getAgentIcon(selectedResponse.agentType, selectedResponse)}</span>
                                        <span className={macText}>{selectedResponse.agentType}</span>
                                    </dd>
                                </div>
                                <div>
                                    <dt className={`block text-[14px] font-medium ${macSubtle} mb-1`}>Timestamp</dt>
                                    <dd className="text-[14px]">
                                        <time dateTime={selectedResponse.timestamp}>
                                            {new Date(selectedResponse.timestamp).toLocaleString()}
                                        </time>
                                    </dd>
                                </div>
                                <div>
                                    <dt className={`block text-[14px] font-medium ${macSubtle} mb-1`}>Requirement & Goal</dt>
                                    <dd className="text-[14px] p-2 bg-[#f5f5f7] rounded-lg border border-[#e5e5ea] whitespace-pre-wrap">
                                        {selectedResponse.requirement}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-[#b0b3b8] mt-20">
                            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
                            <p className="text-[15px]">Select a task response to view details</p>
                        </div>
                    )}
                </aside>
            </main>
        </div>
    );
};

export default MultiAgentCollaborationViewer;