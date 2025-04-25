import { useState, memo } from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

/**
 * 苹果风格的图片控制按钮组件
 */
const ImageControls = ({ zoomIn, zoomOut, resetTransform }) => {
    return (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-4 z-10 bg-white bg-opacity-20 backdrop-blur-lg rounded-full px-5 py-2.5 shadow-lg">
            <button
                onClick={() => zoomOut()}
                className="w-9 h-9 rounded-full flex items-center justify-center text-gray-700 hover:bg-white hover:bg-opacity-25 transition-all duration-300"
                aria-label="Zoom out"
            >
                {/* 缩小图标 */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
            </button>

            <div className="w-px h-6 self-center bg-gray-300 bg-opacity-40"></div>

            <button
                onClick={() => resetTransform()}
                className="w-9 h-9 rounded-full flex items-center justify-center text-gray-700 hover:bg-white hover:bg-opacity-25 transition-all duration-300"
                aria-label="Reset view"
            >
                {/* 重置图标 */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
            </button>

            <div className="w-px h-6 self-center bg-gray-300 bg-opacity-40"></div>

            <button
                onClick={() => zoomIn()}
                className="w-9 h-9 rounded-full flex items-center justify-center text-gray-700 hover:bg-white hover:bg-opacity-25 transition-all duration-300"
                aria-label="Zoom in"
            >
                {/* 放大图标 */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
            </button>
        </div>
    );
};

/**
 * 苹果风格的高级图片显示组件
 * 支持缩放、平移，并固定铺满整个视口（h-screen）
 */
const ImageDisplay = memo(({
    imageData,
    width = '100%',
    imageInitialHeight = null,
    className = '',
    showControls = true,
    showDetails = false,
    initialScale = 1,
    minScale = 0.1,
    maxScale = 5,
    defaultPositionX = 0,
    defaultPositionY = 0
}) => {
    const [status, setStatus] = useState('loading');
    const [imgHeight, setImgHeight] = useState(imageInitialHeight);

    // 计算图片 src
    const getImageSource = () => {
        if (!imageData) return null;
        if (typeof imageData === 'string') return imageData;
        if (imageData.content && typeof imageData.content === 'string') return imageData.content;
        if (imageData.path) return imageData.path;
        return null;
    };
    const imgSrc = getImageSource();

    // 加载完成
    const handleLoad = () => {
        setStatus('loaded');
        if (imageInitialHeight === null) {
            setImgHeight('auto');
        }
    };
    // 加载失败
    const handleError = () => {
        setStatus('error');
    };

    // 文件大小格式化
    const formatFileSize = (bytes) => {
        if (!bytes || bytes === 0) return '0 KB';
        const kb = bytes / 1024;
        return kb < 1024
            ? `${kb.toFixed(1)} KB`
            : `${(kb / 1024).toFixed(1)} MB`;
    };
    // 日期格式化
    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
        } catch {
            return dateString;
        }
    };
    // 渲染文件信息
    const renderFileInfo = () => {
        if (!imageData || typeof imageData !== 'object') return null;
        return (
            <div className="mt-4 border-t border-gray-200 pt-4 text-sm text-gray-700">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3 gap-x-6">
                    <div>
                        <div className="font-medium text-gray-500">Last Edited</div>
                        <div className="mt-0.5">{formatDate(imageData.lastModified)}</div>
                    </div>
                    <div>
                        <div className="font-medium text-gray-500">File Name</div>
                        <div className="mt-0.5 truncate max-w-xs">{imageData.name || '-'}</div>
                    </div>
                </div>
            </div>
        );
    };

    // 无图片时的空状态
    if (!imgSrc) {
        return (
            <div
                className={`flex items-center justify-center bg-gray-50 backdrop-blur-sm rounded-xl ${className} h-screen`}
                style={{ width }}
            >
                <div className="text-center text-gray-400">
                    {/* 空状态图标 */}
                    <svg className="w-14 h-14 mx-auto text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 font-medium">No Image Available</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`relative flex items-center justify-center overflow-hidden ${className} h-screen`}
            style={{ width }}
        >
            {/* 加载动画 */}
            {status === 'loading' && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 backdrop-blur-sm z-10">
                    <div className="w-8 h-8 rounded-full border-2 border-gray-300 border-t-blue-500 animate-spin"></div>
                </div>
            )}

            {/* 错误提示 */}
            {status === 'error' ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-95">
                    <div className="text-center text-gray-600 max-w-xs">
                        <svg className="w-14 h-14 mx-auto text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="mt-3 font-medium">Unable to Load Image</p>
                        <p className="mt-1 text-sm text-gray-500">There was a problem displaying this image. Please try again.</p>
                    </div>
                </div>
            ) : (
                <TransformWrapper
                    initialScale={initialScale}
                    minScale={minScale}
                    maxScale={maxScale}
                    initialPositionX={defaultPositionX}
                    initialPositionY={defaultPositionY}
                    limitToBounds={false}
                    doubleClick={{ disabled: false }}
                    wheel={{ step: 0.1 }}
                >
                    {({ zoomIn, zoomOut, resetTransform }) => (
                        <>
                            {showControls && status === 'loaded' && (
                                <ImageControls
                                    zoomIn={zoomIn}
                                    zoomOut={zoomOut}
                                    resetTransform={resetTransform}
                                />
                            )}
                            <TransformComponent
                                wrapperStyle={{ width: '100%', height: '100%' }}
                                contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <img
                                    src={imgSrc}
                                    alt={typeof imageData === 'object' ? (imageData.name || 'Image') : 'Image'}
                                    className={`rounded-md max-w-none transition-opacity duration-500 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'
                                        }`}
                                    style={{
                                        height: imgHeight,
                                        maxWidth: 'none',
                                        margin: '0 auto',
                                        objectFit: 'contain',
                                        transition: 'opacity 0.5s cubic-bezier(0.23, 1, 0.32, 1)'
                                    }}
                                    onLoad={handleLoad}
                                    onError={handleError}
                                />
                            </TransformComponent>
                        </>
                    )}
                </TransformWrapper>
            )}

            {/* 文件详情 */}
            {showDetails && status === 'loaded' && (
                <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-80 backdrop-blur-md py-3 px-5 transition-all duration-300 ease-in-out">
                    {renderFileInfo()}
                </div>
            )}
        </div>
    );
});

ImageDisplay.displayName = 'ImageDisplay';
export default ImageDisplay;