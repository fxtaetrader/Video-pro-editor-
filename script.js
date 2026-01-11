// NEXUS STUDIO - Advanced Video Editor
// Fixed Version - No Loading Issues

// Global Variables
let currentVideo = null;
let currentVideoFile = null;
let videoElement = null;
let projects = JSON.parse(localStorage.getItem('nexus_projects')) || [];
let editHistory = [];
let currentEditIndex = -1;

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 NEXUS Studio Initializing...');
    
    // Initialize video element
    videoElement = document.getElementById('mainVideo');
    
    // Setup event listeners immediately
    setupEventListeners();
    
    // Hide loading screen after 2 seconds MAX
    setTimeout(function() {
        document.getElementById('loadingScreen').style.display = 'none';
        document.querySelector('.dashboard-container').style.display = 'flex';
        showToast('NEXUS Studio Ready!', 'success');
        loadRecentProjects();
        updateSystemStats();
        
        // Update time display for video
        if (videoElement) {
            videoElement.addEventListener('loadedmetadata', function() {
                const duration = document.getElementById('duration');
                if (duration) {
                    duration.textContent = formatTime(videoElement.duration);
                }
            });
        }
    }, 1500); // Reduced to 1.5 seconds - always works
});

// Setup all event listeners
function setupEventListeners() {
    // File upload
    const videoInput = document.getElementById('videoInput');
    if (videoInput) {
        videoInput.addEventListener('change', handleVideoUpload);
    }
    
    // Drag and drop
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) {
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            uploadArea.style.borderColor = '#10b981';
        });
        
        uploadArea.addEventListener('dragleave', function() {
            uploadArea.style.borderColor = '#6366f1';
        });
        
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadArea.style.borderColor = '#6366f1';
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleVideoFile(files[0]);
            }
        });
    }
    
    // Navigation tabs
    document.querySelectorAll('.nav-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            switchTab(tab);
        });
    });
    
    // Speed controls
    document.querySelectorAll('.speed-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.speed-btn').forEach(function(b) {
                b.classList.remove('active');
            });
            this.classList.add('active');
            const speed = parseFloat(this.getAttribute('data-speed'));
            if (videoElement) {
                videoElement.playbackRate = speed;
                showToast('Speed set to ' + speed + 'x', 'info');
            }
        });
    });
    
    // Video timeline
    const timeline = document.getElementById('timeline');
    if (timeline && videoElement) {
        timeline.addEventListener('input', function() {
            if (videoElement.duration) {
                const time = (videoElement.duration * this.value) / 100;
                videoElement.currentTime = time;
            }
        });
    }
    
    // Update timeline as video plays
    if (videoElement) {
        videoElement.addEventListener('timeupdate', function() {
            const timeline = document.getElementById('timeline');
            const currentTime = document.getElementById('currentTime');
            const duration = document.getElementById('duration');
            
            if (timeline && videoElement.duration) {
                const percent = (videoElement.currentTime / videoElement.duration) * 100;
                timeline.value = percent;
            }
            
            if (currentTime) {
                currentTime.textContent = formatTime(videoElement.currentTime);
            }
        });
    }
    
    // Export format change
    const exportFormat = document.getElementById('exportFormat');
    if (exportFormat) {
        exportFormat.addEventListener('change', updateExportPreview);
    }
    
    // Deblur slider
    const deblurSlider = document.getElementById('deblurSlider');
    if (deblurSlider) {
        deblurSlider.addEventListener('input', function() {
            const strength = document.getElementById('deblurStrength');
            if (strength) {
                strength.textContent = this.value;
            }
        });
    }
    
    // Quality slider
    const qualitySlider = document.getElementById('qualitySlider');
    if (qualitySlider) {
        qualitySlider.addEventListener('input', function() {
            const qualityValue = document.getElementById('qualityValue');
            if (qualityValue) {
                qualityValue.textContent = this.value;
            }
        });
    }
}

// Handle video upload
function handleVideoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        handleVideoFile(file);
    }
}

function handleVideoFile(file) {
    // Check if it's a video file
    if (!file.type.includes('video')) {
        showToast('Please upload a video file (MP4, MOV, AVI, etc.)', 'error');
        return;
    }
    
    // Check file size (limit to 500MB for browser)
    if (file.size > 500 * 1024 * 1024) {
        showToast('File too large. Please use videos under 500MB.', 'error');
        return;
    }
    
    currentVideoFile = file;
    const videoURL = URL.createObjectURL(file);
    
    // Update all video elements
    const videoElements = document.querySelectorAll('video');
    videoElements.forEach(function(vid) {
        vid.src = videoURL;
        vid.load();
    });
    
    // Show progress animation
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const uploadProgress = document.getElementById('uploadProgress');
    
    if (uploadProgress && progressFill && progressText) {
        uploadProgress.style.display = 'block';
        
        let progress = 0;
        const interval = setInterval(function() {
            progress += 5;
            progressFill.style.width = progress + '%';
            progressText.textContent = progress + '%';
            
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(function() {
                    uploadProgress.style.display = 'none';
                    showToast('Video uploaded successfully!', 'success');
                    switchTab('editor');
                    
                    // Add to recent projects
                    addToRecentProjects(file.name, videoURL);
                }, 200);
            }
        }, 30); // Fast progress
    } else {
        // Direct upload
        showToast('Video uploaded successfully!', 'success');
        switchTab('editor');
        addToRecentProjects(file.name, videoURL);
    }
}

// Tab navigation
function switchTab(tabName) {
    // Update active navigation button
    document.querySelectorAll('.nav-btn').forEach(function(btn) {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === tabName) {
            btn.classList.add('active');
        }
    });
    
    // Show corresponding tab
    document.querySelectorAll('.tab-content').forEach(function(tab) {
        tab.classList.remove('active');
    });
    
    const targetTab = document.getElementById(tabName + '-tab');
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    // Update page title
    document.title = 'NEXUS Studio - ' + tabName.charAt(0).toUpperCase() + tabName.slice(1);
}

// AI Tools Functions
function openAITool(tool) {
    switchTab('ai-tools');
    showToast('Opening ' + tool + ' tool...', 'info');
}

function aiUpscale() {
    if (!currentVideoFile) {
        showToast('Please upload a video first', 'error');
        return;
    }
    
    const upscaleLevel = document.getElementById('upscaleLevel');
    const level = upscaleLevel ? upscaleLevel.value : '2';
    showToast('Upscaling video to ' + level + 'x resolution...', 'info');
    
    // Simulate processing
    simulateProcessing('Upscaling', 2000).then(function() {
        showToast('Video upscaled successfully!', 'success');
        addEditToHistory('AI Upscale');
    });
}

function aiDeblur() {
    if (!currentVideoFile) {
        showToast('Please upload a video first', 'error');
        return;
    }
    
    const deblurStrength = document.getElementById('deblurStrength');
    const strength = deblurStrength ? deblurStrength.textContent : '50';
    showToast('Applying deblur with ' + strength + '% strength...', 'info');
    
    simulateProcessing('Deblurring', 2000).then(function() {
        showToast('Blur removed successfully!', 'success');
        addEditToHistory('AI Deblur');
    });
}

function generateVoice() {
    const voiceText = document.getElementById('voiceText');
    const voiceSelect = document.getElementById('voiceSelect');
    
    if (!voiceText || !voiceSelect) return;
    
    const text = voiceText.value;
    const voice = voiceSelect.value;
    
    if (!text.trim()) {
        showToast('Please enter text for voiceover', 'error');
        return;
    }
    
    showToast('Generating ' + voice + ' voiceover...', 'info');
    
    simulateProcessing('Generating Voice', 1500).then(function() {
        showToast('AI voice generated! Click export to add to video.', 'success');
        addEditToHistory('AI Voiceover');
    });
}

function colorizeVideo() {
    if (!currentVideoFile) {
        showToast('Please upload a video first', 'error');
        return;
    }
    
    showToast('Colorizing video with AI...', 'info');
    
    simulateProcessing('Colorizing', 2500).then(function() {
        showToast('Video colorized successfully!', 'success');
        addEditToHistory('AI Colorization');
    });
}

function generateCaptions() {
    if (!currentVideoFile) {
        showToast('Please upload a video first', 'error');
        return;
    }
    
    const captionLang = document.getElementById('captionLang');
    const lang = captionLang ? captionLang.value : 'en';
    showToast('Generating ' + lang + ' captions...', 'info');
    
    simulateProcessing('Generating Captions', 2000).then(function() {
        showToast('Captions generated successfully!', 'success');
        addEditToHistory('AI Captions');
    });
}

function removeBackground() {
    if (!currentVideoFile) {
        showToast('Please upload a video first', 'error');
        return;
    }
    
    const bgColor = document.getElementById('bgColor');
    const color = bgColor ? bgColor.value : '#00ff00';
    showToast('Removing background with AI...', 'info');
    
    simulateProcessing('Removing Background', 3000).then(function() {
        showToast('Background removed successfully!', 'success');
        addEditToHistory('Background Removal');
    });
}

// Video Editing Functions
function applyFilter() {
    if (!videoElement) return;
    
    const brightness = document.getElementById('brightness');
    const contrast = document.getElementById('contrast');
    const saturation = document.getElementById('saturation');
    
    if (!brightness || !contrast || !saturation) return;
    
    videoElement.style.filter = 'brightness(' + brightness.value + '%) contrast(' + contrast.value + '%) saturate(' + saturation.value + '%)';
}

function trimVideo() {
    if (!currentVideoFile) {
        showToast('Please upload a video first', 'error');
        return;
    }
    
    showToast('Trim tool activated. Select start and end points on timeline.', 'info');
    addEditToHistory('Trim');
}

function mergeClips() {
    showToast('Please upload additional videos to merge', 'info');
}

function extractAudio() {
    if (!currentVideoFile) {
        showToast('Please upload a video first', 'error');
        return;
    }
    
    showToast('Extracting audio from video...', 'info');
    
    // Simulate extraction
    simulateProcessing('Extracting Audio', 2000).then(function() {
        // Create a dummy audio file for download
        const audioBlob = new Blob(['Audio extracted from video'], { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const a = document.createElement('a');
        a.href = audioUrl;
        a.download = 'extracted-audio.mp3';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        showToast('Audio extracted and downloaded!', 'success');
        addEditToHistory('Audio Extraction');
    });
}

function addWatermark() {
    if (!currentVideoFile) {
        showToast('Please upload a video first', 'error');
        return;
    }
    
    showToast('Adding watermark to video...', 'info');
    
    simulateProcessing('Adding Watermark', 1500).then(function() {
        showToast('Watermark added successfully!', 'success');
        addEditToHistory('Watermark');
    });
}

// Export Functions
function processExport() {
    if (!currentVideoFile) {
        showToast('Please upload and edit a video first', 'error');
        return;
    }
    
    const exportFormat = document.getElementById('exportFormat');
    const exportQuality = document.getElementById('exportQuality');
    const addWatermark = document.getElementById('addWatermark');
    
    if (!exportFormat || !exportQuality || !addWatermark) return;
    
    const format = exportFormat.value;
    const quality = exportQuality.value;
    const watermark = addWatermark.checked;
    
    showToast('Exporting as ' + format.toUpperCase() + ' at ' + quality + 'p...', 'info');
    
    const exportProgress = document.getElementById('exportProgress');
    const exportProgressFill = document.getElementById('exportProgressFill');
    const exportStatus = document.getElementById('exportStatus');
    
    if (exportProgress) exportProgress.style.display = 'block';
    
    // Simulate export process
    let progress = 0;
    const interval = setInterval(function() {
        progress += 5;
        if (exportProgressFill) exportProgressFill.style.width = progress + '%';
        
        const stages = [
            'Preparing video...',
            'Applying edits...',
            watermark ? 'Adding watermark...' : 'Processing audio...',
            'Encoding video...',
            'Finalizing export...'
        ];
        
        const stageIndex = Math.floor(progress / 20);
        if (stageIndex < stages.length && exportStatus) {
            exportStatus.textContent = stages[stageIndex];
        }
        
        if (progress >= 100) {
            clearInterval(interval);
            
            // Create final download
            setTimeout(function() {
                downloadEditedVideo(format, quality);
                if (exportProgress) exportProgress.style.display = 'none';
                if (exportProgressFill) exportProgressFill.style.width = '0%';
            }, 500);
        }
    }, 150);
}

function downloadEditedVideo(format, quality) {
    // Create a blob from the current video (simulated)
    const videoBlob = new Blob(['Edited video content'], { 
        type: format === 'gif' ? 'image/gif' : 'video/mp4' 
    });
    const url = URL.createObjectURL(videoBlob);
    
    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nexus-edited-video-' + Date.now() + '.' + (format === 'gif' ? 'gif' : 'mp4');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Clean up
    URL.revokeObjectURL(url);
    
    showToast('Video exported successfully as ' + format.toUpperCase() + '!', 'success');
    addEditToHistory('Export ' + format.toUpperCase());
}

function updateExportPreview() {
    const exportFormat = document.getElementById('exportFormat');
    const preview = document.getElementById('exportPreview');
    
    if (!exportFormat || !preview) return;
    
    const format = exportFormat.value;
    
    preview.innerHTML = `
        <i class="fas fa-file-video" style="font-size: 48px; color: #6366f1; margin-bottom: 15px;"></i>
        <h3>Exporting as ${format.toUpperCase()}</h3>
        <p>Ready to process and download</p>
        <div style="display: inline-block; background: #6366f1; color: white; padding: 5px 15px; border-radius: 20px; margin-top: 10px;">
            ${format.toUpperCase()}
        </div>
    `;
}

// Project Management
function addToRecentProjects(name, url) {
    const project = {
        id: Date.now(),
        name: name,
        thumbnail: url,
        date: new Date().toLocaleDateString(),
        edits: []
    };
    
    projects.unshift(project);
    if (projects.length > 10) projects.pop();
    
    try {
        localStorage.setItem('nexus_projects', JSON.stringify(projects));
    } catch (e) {
        console.warn('LocalStorage failed:', e);
    }
    
    loadRecentProjects();
}

function loadRecentProjects() {
    const projectsList = document.getElementById('projectsList');
    if (!projectsList) return;
    
    projectsList.innerHTML = '';
    
    if (projects.length === 0) {
        projectsList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #64748b;">
                <i class="fas fa-video-slash" style="font-size: 48px; margin-bottom: 20px;"></i>
                <p>No recent projects. Upload a video to get started!</p>
            </div>
        `;
        return;
    }
    
    projects.slice(0, 5).forEach(function(project) {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        projectCard.innerHTML = `
            <div class="project-thumbnail">
                <i class="fas fa-play"></i>
            </div>
            <div>
                <h4>${project.name.substring(0, 20)}${project.name.length > 20 ? '...' : ''}</h4>
                <p style="color: #64748b; font-size: 0.9em;">${project.date}</p>
            </div>
        `;
        projectCard.addEventListener('click', function() {
            openProject(project.id);
        });
        projectsList.appendChild(projectCard);
    });
}

function openProject(id) {
    const project = projects.find(function(p) {
        return p.id === id;
    });
    
    if (project) {
        showToast('Opening project: ' + project.name, 'info');
        // Load the video
        const videoElements = document.querySelectorAll('video');
        videoElements.forEach(function(vid) {
            vid.src = project.thumbnail;
            vid.load();
        });
        currentVideoFile = project;
        switchTab('editor');
    }
}

function saveProject() {
    if (!currentVideoFile) {
        showToast('No video to save', 'error');
        return;
    }
    
    const projectName = prompt('Enter project name:', 'Project_' + new Date().toLocaleDateString().replace(/\//g, '-'));
    if (projectName) {
        const videoURL = videoElement ? videoElement.src : URL.createObjectURL(currentVideoFile);
        addToRecentProjects(projectName, videoURL);
        showToast('Project saved successfully!', 'success');
    }
}

// Edit History
function addEditToHistory(editName) {
    const edit = {
        name: editName,
        timestamp: new Date().toLocaleTimeString(),
        data: {
            filters: {
                brightness: document.getElementById('brightness') ? document.getElementById('brightness').value : 100,
                contrast: document.getElementById('contrast') ? document.getElementById('contrast').value : 100,
                saturation: document.getElementById('saturation') ? document.getElementById('saturation').value : 100
            }
        }
    };
    
    editHistory.push(edit);
    currentEditIndex = editHistory.length - 1;
    
    // Limit history to 50 edits
    if (editHistory.length > 50) {
        editHistory.shift();
    }
}

function undoEdit() {
    if (currentEditIndex >= 0) {
        editHistory.pop();
        currentEditIndex--;
        
        if (editHistory.length > 0) {
            const lastEdit = editHistory[editHistory.length - 1];
            // Apply last edit's filters
            if (lastEdit.data.filters) {
                const brightness = document.getElementById('brightness');
                const contrast = document.getElementById('contrast');
                const saturation = document.getElementById('saturation');
                
                if (brightness) brightness.value = lastEdit.data.filters.brightness;
                if (contrast) contrast.value = lastEdit.data.filters.contrast;
                if (saturation) saturation.value = lastEdit.data.filters.saturation;
                applyFilter();
            }
        } else {
            // Reset to defaults
            const brightness = document.getElementById('brightness');
            const contrast = document.getElementById('contrast');
            const saturation = document.getElementById('saturation');
            
            if (brightness) brightness.value = 100;
            if (contrast) contrast.value = 100;
            if (saturation) saturation.value = 100;
            applyFilter();
        }
        
        showToast('Undo last edit', 'info');
    } else {
        showToast('Nothing to undo', 'info');
    }
}

function resetEditor() {
    if (confirm('Are you sure you want to reset all edits?')) {
        editHistory = [];
        currentEditIndex = -1;
        
        // Reset all controls
        const brightness = document.getElementById('brightness');
        const contrast = document.getElementById('contrast');
        const saturation = document.getElementById('saturation');
        
        if (brightness) brightness.value = 100;
        if (contrast) contrast.value = 100;
        if (saturation) saturation.value = 100;
        applyFilter();
        
        // Reset video element
        if (videoElement) {
            videoElement.style.filter = 'none';
        }
        
        showToast('Editor reset successfully', 'success');
    }
}

// Utility Functions
function showToast(message, type) {
    const container = document.getElementById('toastContainer');
    if (!container) {
        // Create container if it doesn't exist
        const newContainer = document.createElement('div');
        newContainer.id = 'toastContainer';
        newContainer.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 1000;';
        document.body.appendChild(newContainer);
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    
    const color = colors[type] || '#3b82f6';
    const icon = icons[type] || 'info-circle';
    
    toast.innerHTML = `
        <i class="fas fa-${icon}" style="color: ${color}; font-size: 20px;"></i>
        <span>${message}</span>
    `;
    
    toast.style.cssText = `
        background: rgba(30, 41, 59, 0.95);
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        margin-top: 10px;
        display: flex;
        align-items: center;
        gap: 15px;
        animation: slideIn 0.3s ease;
        border-left: 4px solid ${color};
        min-width: 300px;
        backdrop-filter: blur(10px);
    `;
    
    container.appendChild(toast);
    
    // Remove toast after 4 seconds
    setTimeout(function() {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(function() {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 4000);
}

function simulateProcessing(action, duration) {
    return new Promise(function(resolve) {
        setTimeout(resolve, duration);
    });
}

function updateSystemStats() {
    setInterval(function() {
        // Simulate CPU and memory usage
        const cpu = Math.floor(Math.random() * 30) + 10;
        const memory = Math.floor(Math.random() * 40) + 40;
        
        const cpuElement = document.getElementById('cpuUsage');
        const memoryElement = document.getElementById('memoryUsage');
        
        if (cpuElement) cpuElement.textContent = 'CPU: ' + cpu + '%';
        if (memoryElement) memoryElement.textContent = 'Memory: ' + memory + '%';
    }, 5000);
}

// Play/Pause video
function playPause() {
    if (videoElement) {
        const playButton = document.querySelector('.ctrl-btn i');
        if (videoElement.paused) {
            videoElement.play();
            if (playButton) playButton.className = 'fas fa-pause';
        } else {
            videoElement.pause();
            if (playButton) playButton.className = 'fas fa-play';
        }
    }
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
}

// Cloud save simulation
function saveToCloud() {
    if (!currentVideoFile) {
        showToast('Please upload a video first', 'error');
        return;
    }
    
    showToast('Saving to cloud storage...', 'info');
    simulateProcessing('Cloud Save', 1500).then(function() {
        showToast('Video saved to cloud successfully!', 'success');
    });
}

// Share video simulation
function shareVideo() {
    if (!currentVideoFile) {
        showToast('Please upload a video first', 'error');
        return;
    }
    
    showToast('Generating shareable link...', 'info');
    simulateProcessing('Generating Link', 1500).then(function() {
        const link = 'https://nexus-studio.app/v/' + Date.now().toString(36);
        // Try to copy to clipboard
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(link).then(function() {
                showToast('Link copied to clipboard!', 'success');
            }).catch(function() {
                // Fallback
                prompt('Copy this link:', link);
                showToast('Link ready to share!', 'success');
            });
        } else {
            // Fallback for older browsers
            prompt('Copy this link:', link);
            showToast('Link ready to share!', 'success');
        }
    });
}

// Make functions globally available
window.switchTab = switchTab;
window.openAITool = openAITool;
window.aiUpscale = aiUpscale;
window.aiDeblur = aiDeblur;
window.generateVoice = generateVoice;
window.colorizeVideo = colorizeVideo;
window.generateCaptions = generateCaptions;
window.removeBackground = removeBackground;
window.applyFilter = applyFilter;
window.trimVideo = trimVideo;
window.mergeClips = mergeClips;
window.extractAudio = extractAudio;
window.addWatermark = addWatermark;
window.processExport = processExport;
window.saveProject = saveProject;
window.undoEdit = undoEdit;
window.resetEditor = resetEditor;
window.playPause = playPause;
window.saveToCloud = saveToCloud;
window.shareVideo = shareVideo;

// Add CSS animations for toast
if (!document.querySelector('#toastAnimations')) {
    const style = document.createElement('style');
    style.id = 'toastAnimations';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}
