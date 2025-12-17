// Import KIR Service
import { KIRService } from '../../services/backend/KIRService.js';
import { validateKIR } from '../../lib/validators.js';
import { formatICWithDashes, normalizeICDigits } from './KIRProfile/components/shared/icUtils.js';

export class SenaraiKIR {
    constructor() {
        this.currentKIRData = [];
        this.currentPage = 1;
        this.pageSize = 10;
        this.totalRecords = 0;
        this.pageCursors = { 1: null };
        this.hasMore = false;
        this.currentFilters = {
            search: '',
            status: 'all',
            negeri: 'all'
        };
    }

    resetPaginationState() {
        this.currentPage = 1;
        this.pageCursors = { 1: null };
        this.hasMore = false;
        this.totalRecords = 0;
    }

    createContent() {
        return `
            <div class="content-header">
                <h2>Senarai KIR</h2>
                <p class="content-description">View and manage all KIR records</p>
            </div>

            <div class="filters-section">
                <div class="filters-row">
                    <div class="search-group">
                        <input type="text" id="kir-search-new" placeholder="Cari nama atau No. KP..." class="search-input">
                        <button id="search-btn-new" class="btn btn-primary">🔍 Cari</button>
                    </div>
                    <div class="filter-group">
                        <select id="status-filter-new" class="filter-select">
                            <option value="all">Semua Status</option>
                            <option value="Draf">Draf</option>
                            <option value="Dihantar">Dihantar</option>
                            <option value="Disahkan">Disahkan</option>
                        </select>
                        <select id="negeri-filter-new" class="filter-select">
                            <option value="all">Semua Negeri</option>
                            <option value="Johor">Johor</option>
                            <option value="Kedah">Kedah</option>
                            <option value="Kelantan">Kelantan</option>
                            <option value="Melaka">Melaka</option>
                            <option value="Negeri Sembilan">Negeri Sembilan</option>
                            <option value="Pahang">Pahang</option>
                            <option value="Perak">Perak</option>
                            <option value="Perlis">Perlis</option>
                            <option value="Pulau Pinang">Pulau Pinang</option>
                            <option value="Sabah">Sabah</option>
                            <option value="Sarawak">Sarawak</option>
                            <option value="Selangor">Selangor</option>
                            <option value="Terengganu">Terengganu</option>
                            <option value="Wilayah Persekutuan Kuala Lumpur">WP Kuala Lumpur</option>
                            <option value="Wilayah Persekutuan Labuan">WP Labuan</option>
                            <option value="Wilayah Persekutuan Putrajaya">WP Putrajaya</option>
                        </select>
                        <button id="reset-filters-new" class="btn btn-secondary">Reset</button>
                    </div>
                </div>
            </div>

            <div class="table-container">
                <div class="table-header">
                    <div class="table-info">
                        <span id="table-info-new">Menunjukkan 0 daripada 0 rekod</span>
                    </div>
                    <div class="table-actions">
                        <button class="btn btn-success" onclick="senaraiKIRNew.showCreateKIRModal()">+ Tambah KIR Baru</button>
                    </div>
                </div>

                <div class="table-wrapper">
                    <table class="kir-table">
                        <thead>
                            <tr>
                                <th>KIR ID</th>
                                <th>NAMA</th>
                                <th>IC NUMBER</th>
                                <th>STATUS</th>
                                <th>CREATED DATE</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody id="senariKirNewTableBody">
                            <tr>
                                <td colspan="6" style="text-align: center; padding: 2rem;">
                                    <div class="loading-spinner">Memuatkan data...</div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="pagination-container">
                    <div class="pagination-info">
                        <span id="pagination-info-new">Halaman 1 daripada 1</span>
                    </div>
                    <div class="pagination-controls">
                        <button id="prev-page-new" class="btn btn-outline" disabled>← Sebelum</button>
                        <button id="next-page-new" class="btn btn-outline" disabled>Seterusnya →</button>
                    </div>
                </div>
            </div>

            <div id="error-message-new" class="error-message" style="display: none;"></div>

            <!-- ========== CREATE KIR MODAL ========== -->
            <div id="create-kir-modal" class="modal-overlay" style="display: none;">
                <div class="modal-container">
                    <div class="modal-header">
                        <h3>Tambah KIR Baru</h3>
                        <button class="modal-close-btn" onclick="senaraiKIRNew.closeCreateKIRModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="create-kir-form">
                            <div class="form-group">
                                <label for="kir-nama">Nama Penuh <span class="required">*</span></label>
                                <input 
                                    type="text" 
                                    id="kir-nama" 
                                    name="nama_penuh" 
                                    class="form-input" 
                                    placeholder="Masukkan nama penuh"
                                    required
                                >
                                <div class="error-text" id="nama-error"></div>
                            </div>
                            <div class="form-group">
                                <label for="kir-ic">No. Kad Pengenalan <span class="required">*</span></label>
                                <input 
                                    type="text" 
                                    id="kir-ic" 
                                    name="no_kp" 
                                    class="form-input" 
                                    placeholder="123456-12-1234"
                                    maxlength="14"
                                    required
                                >
                                <div class="error-text" id="ic-error"></div>
                                <small class="form-help">Ikuti format standard: 123456-12-1234</small>
                            </div>
                            <div class="form-group identity-type-group">
                                <label>Jenis Dokumen</label>
                                <div class="identity-type-options">
                                    <label class="identity-type-option">
                                        <input type="radio" name="kir_identity_type" value="nric" checked>
                                        <span>No. Kad Pengenalan</span>
                                    </label>
                                    <label class="identity-type-option">
                                        <input type="radio" name="kir_identity_type" value="passport">
                                        <span>Passport</span>
                                    </label>
                                </div>
                                <small class="form-help">Pilih "Passport" untuk benarkan nombor alfanumerik.</small>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="senaraiKIRNew.closeCreateKIRModal()">
                            Batal
                        </button>
                        <button type="button" class="btn btn-success" onclick="senaraiKIRNew.submitCreateKIRForm()" id="create-kir-submit-btn">
                            <span class="btn-text">Cipta KIR</span>
                            <span class="btn-loading" style="display: none;">
                                <span class="loading-spinner"></span> Mencipta...
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- ========== SUCCESS/ERROR TOAST ========== -->
            <div id="toast-message" class="toast-message" style="display: none;">
                <div class="toast-content">
                    <span class="toast-icon"></span>
                    <span class="toast-text"></span>
                </div>
            </div>

            <style>
            /* Enhanced Table Styles */
             .kir-table {
                 width: 100%;
                 border-collapse: collapse;
                 background: white;
                 border-radius: 12px;
                 overflow: hidden;
                 box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
             }

             .kir-table thead {
                 background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                 color: white;
             }

             .kir-table th {
                 padding: 1rem;
                 text-align: left;
                 font-weight: 600;
                 font-size: 0.875rem;
                 text-transform: uppercase;
                 letter-spacing: 0.05em;
             }

             .kir-table tbody tr {
                 border-bottom: 1px solid #f1f5f9;
                 transition: all 0.2s ease;
             }

             .kir-table tbody tr:hover {
                 background-color: #f8fafc;
                 transform: translateY(-1px);
                 box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
             }

             .kir-table td {
                 padding: 1rem;
                 vertical-align: middle;
             }

             /* User Info Styles */
             .user-info {
                 display: flex;
                 align-items: center;
                 gap: 0.75rem;
             }

             .user-avatar {
                 width: 40px;
                 height: 40px;
                 border-radius: 50%;
                 background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                 color: white;
                 display: flex;
                 align-items: center;
                 justify-content: center;
                 font-weight: 600;
                 font-size: 1rem;
             }

             .user-details {
                 display: flex;
                 flex-direction: column;
                 gap: 0.25rem;
             }

             .kir-id {
                 font-weight: 600;
                 color: #1e293b;
                 font-size: 0.875rem;
             }

             .user-name {
                 font-weight: 600;
                 color: #1e293b;
                 font-size: 0.875rem;
             }

             .user-email {
                 color: #64748b;
                 font-size: 0.75rem;
             }

             /* Status Badge Styles */
             .status-badge {
                 display: inline-flex;
                 align-items: center;
                 padding: 0.375rem 0.75rem;
                 border-radius: 9999px;
                 font-size: 0.75rem;
                 font-weight: 600;
                 text-transform: uppercase;
                 letter-spacing: 0.05em;
             }

             .status-badge.draft {
                 background-color: #fef3c7;
                 color: #92400e;
             }

             .status-badge.submitted {
                 background-color: #dbeafe;
                 color: #1e40af;
             }

             .status-badge.approved {
                 background-color: #d1fae5;
                 color: #065f46;
             }

             .status-badge.inactive {
                 background-color: #fee2e2;
                 color: #991b1b;
             }

             /* Action Buttons Styles */
             .action-buttons {
                 display: flex;
                 gap: 0.5rem;
                 align-items: center;
             }

             .btn-sm {
                 padding: 0.5rem 1rem;
                 font-size: 0.75rem;
                 font-weight: 500;
                 border-radius: 6px;
                 border: none;
                 cursor: pointer;
                 transition: all 0.2s ease;
                 display: inline-flex;
                 align-items: center;
                 gap: 0.375rem;
                 text-decoration: none;
             }

             .btn-edit {
                 background-color: #3b82f6;
                 color: white;
             }

             .btn-edit:hover {
                 background-color: #2563eb;
                 transform: translateY(-1px);
                 box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
             }

             .btn-delete {
                 background-color: #ef4444;
                 color: white;
             }

             .btn-delete:hover {
                 background-color: #dc2626;
                 transform: translateY(-1px);
                 box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
             }

             .icon-edit, .icon-delete {
                 font-size: 0.875rem;
             }

             /* Table Container Improvements */
             .table-container {
                 background: white;
                 border-radius: 12px;
                 padding: 1.5rem;
                 box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                 margin-bottom: 2rem;
             }

             .table-header {
                 display: flex;
                 justify-content: space-between;
                 align-items: center;
                 margin-bottom: 1.5rem;
                 padding-bottom: 1rem;
                 border-bottom: 1px solid #e2e8f0;
             }

             .table-info {
                 color: #64748b;
                 font-size: 0.875rem;
             }

             .table-actions .btn {
                 background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                 color: white;
                 border: none;
                 padding: 0.75rem 1.5rem;
                 border-radius: 8px;
                 font-weight: 600;
                 cursor: pointer;
                 transition: all 0.2s ease;
                 box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
             }

             .table-actions .btn:hover {
                 transform: translateY(-2px);
                 box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
             }

             /* Pagination Improvements */
             .pagination-container {
                 display: flex;
                 justify-content: space-between;
                 align-items: center;
                 margin-top: 1.5rem;
                 padding-top: 1rem;
                 border-top: 1px solid #e2e8f0;
             }

             .pagination-info {
                 color: #64748b;
                 font-size: 0.875rem;
             }

             .pagination-controls {
                 display: flex;
                 gap: 0.5rem;
             }

             .btn-outline {
                 background: white;
                 color: #64748b;
                 border: 1px solid #e2e8f0;
                 padding: 0.5rem 1rem;
                 border-radius: 6px;
                 font-size: 0.875rem;
                 cursor: pointer;
                 transition: all 0.2s ease;
             }

             .btn-outline:hover:not(:disabled) {
                 background-color: #f8fafc;
                 border-color: #cbd5e1;
                 color: #475569;
             }

             .btn-outline:disabled {
                 opacity: 0.5;
                 cursor: not-allowed;
             }

             /* Loading and Empty States */
             .loading-spinner {
                 display: inline-block;
                 width: 20px;
                 height: 20px;
                 border: 3px solid #f3f4f6;
                 border-radius: 50%;
                 border-top-color: #3b82f6;
                 animation: spin 1s ease-in-out infinite;
             }

             @keyframes spin {
                 to { transform: rotate(360deg); }
             }

             /* Responsive Design */
             @media (max-width: 768px) {
                 .table-header {
                     flex-direction: column;
                     gap: 1rem;
                     align-items: stretch;
                 }

                 .pagination-container {
                     flex-direction: column;
                     gap: 1rem;
                     align-items: center;
                 }

                 .action-buttons {
                     flex-direction: column;
                     gap: 0.25rem;
                 }

                 .btn-sm {
                     width: 100%;
                     justify-content: center;
                 }
             }
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }

            /* Modal Container */
            .modal-container {
                background: white;
                border-radius: 8px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                width: 90%;
                max-width: 500px;
                max-height: 90vh;
                overflow-y: auto;
            }

            /* Modal Header */
            .modal-header {
                padding: 1.5rem;
                border-bottom: 1px solid #e5e7eb;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .modal-header h3 {
                margin: 0;
                color: #1f2937;
                font-size: 1.25rem;
                font-weight: 600;
            }

            .modal-close-btn {
                background: none;
                border: none;
                font-size: 1.5rem;
                color: #6b7280;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: background-color 0.2s;
            }

            .modal-close-btn:hover {
                background-color: #f3f4f6;
                color: #374151;
            }

            /* Modal Body */
            .modal-body {
                padding: 1.5rem;
            }

            /* Modal Footer */
            .modal-footer {
                padding: 1.5rem;
                border-top: 1px solid #e5e7eb;
                display: flex;
                justify-content: flex-end;
                gap: 0.75rem;
            }

            /* Form Styles */
            .form-group {
                margin-bottom: 1.5rem;
            }

            .form-group label {
                display: block;
                margin-bottom: 0.5rem;
                color: #374151;
                font-weight: 500;
                font-size: 0.875rem;
            }

            .required {
                color: #dc2626;
            }

            .form-input {
                width: 100%;
                padding: 0.75rem;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-size: 0.875rem;
                transition: border-color 0.2s, box-shadow 0.2s;
                box-sizing: border-box;
            }

            .form-input:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }

            .form-input.error {
                border-color: #dc2626;
            }

            .form-input.error:focus {
                border-color: #dc2626;
                box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
            }

            .error-text {
                color: #dc2626;
                font-size: 0.75rem;
                margin-top: 0.25rem;
                display: block;
            }

            .form-help {
                color: #6b7280;
                font-size: 0.75rem;
                margin-top: 0.25rem;
                display: block;
            }

            /* Button Loading State */
            .btn-loading {
                display: none;
                align-items: center;
                gap: 0.5rem;
            }

            .loading-spinner {
                width: 16px;
                height: 16px;
                border: 2px solid #ffffff;
                border-top: 2px solid transparent;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            /* Toast Styles */
            .toast-message {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1100;
                min-width: 300px;
                padding: 1rem;
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                transition: all 0.3s ease;
            }

            .toast-success {
                background-color: #10b981;
                color: white;
            }

            .toast-error {
                background-color: #ef4444;
                color: white;
            }

            .toast-content {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }

            .toast-icon {
                font-size: 1.25rem;
            }

            .toast-text {
                flex: 1;
                font-weight: 500;
            }

            .identity-type-group {
                margin-top: 0.5rem;
            }

            .identity-type-options {
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
                margin-top: 0.35rem;
            }

            .identity-type-option {
                display: inline-flex;
                align-items: center;
                gap: 0.4rem;
                font-weight: 500;
                color: #475569;
            }

            .identity-type-option input {
                width: auto;
            }
            </style>
                <div class="toast-content">
                    <span class="toast-icon"></span>
                    <span class="toast-text"></span>
                </div>
            </div>
        `;
    }

    async initialize() {
        console.log('Initializing SenaraiKIR (New)...');
        
        // Add a small delay to ensure DOM is ready
        setTimeout(() => {
            this.setupEventListeners();
        }, 100);
        
        // Load initial data
        await this.loadKIRData();
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Search functionality
        const searchInput = document.getElementById('kir-search-new');
        const searchBtn = document.getElementById('search-btn-new');
        
        if (searchInput && searchBtn) {
            searchBtn.addEventListener('click', () => this.handleSearch());
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleSearch();
            });
        }

        // Filter functionality
        const statusFilter = document.getElementById('status-filter-new');
        const negeriFilter = document.getElementById('negeri-filter-new');
        const resetBtn = document.getElementById('reset-filters-new');

        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.handleFilterChange());
        }
        if (negeriFilter) {
            negeriFilter.addEventListener('change', () => this.handleFilterChange());
        }
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetFilters());
        }

        // Pagination
        const prevBtn = document.getElementById('prev-page-new');
        const nextBtn = document.getElementById('next-page-new');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousPage());
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextPage());
        }

        // IC number input mask
        document.addEventListener('input', (e) => {
            if (e.target && e.target.id === 'kir-ic') {
                const type = this.getSelectedIdentityType();
                if (type === 'passport') {
                    e.target.value = this.sanitizeIdentityValue(e.target.value, 'passport');
                } else {
                    const digits = this.sanitizeIdentityValue(e.target.value, 'nric');
                    e.target.value = this.formatNRICForInput(digits);
                }
            }
        });
    }

    async loadKIRData() {
        try {
            this.showLoadingState();
            
            const params = {
                search: this.currentFilters.search,
                status: this.currentFilters.status === 'all' ? '' : this.mapStatusToDatabase(this.currentFilters.status),
                daerah: this.currentFilters.negeri === 'all' ? '' : this.currentFilters.negeri,
                pageCursor: this.pageCursors[this.currentPage] || null,
                pageSize: this.pageSize
            };

            console.log('Loading KIR data with params:', params);
            const result = await KIRService.getKIRList(params);
            
            this.currentKIRData = result.items || [];
            this.hasMore = !!result.hasMore;
            const nextCursor = result.nextCursor || null;
            if (nextCursor) {
                this.pageCursors[this.currentPage + 1] = nextCursor;
            } else {
                delete this.pageCursors[this.currentPage + 1];
            }
            this.totalRecords = (this.currentPage - 1) * this.pageSize + this.currentKIRData.length;
            
            this.renderKIRTable();
            this.updateTableInfo();
            this.updatePagination();
            
        } catch (error) {
            console.error('Error loading KIR data:', error);
            this.showErrorMessage('Ralat memuatkan data KIR. Sila cuba lagi.');
        } finally {
            this.hideLoadingState();
        }
    }

    renderKIRTable() {
        const tableBody = document.getElementById('senariKirNewTableBody');
        if (!tableBody) return;

        if (this.currentKIRData.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem; color: #64748b;">
                        Tiada data KIR dijumpai.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = this.currentKIRData.map(kir => `
            <tr class="kir-row">
                <td>
                    <div class="user-info">
                        <div class="user-avatar">${(kir.nama_penuh || 'N').charAt(0).toUpperCase()}</div>
                        <div class="user-details">
                            <span class="kir-id">${kir.id || 'N/A'}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="user-details">
                        <span class="user-name">${kir.nama_penuh || 'Tiada Nama'}</span>
                        <span class="user-email">${kir.email || 'Tiada Email'}</span>
                    </div>
                </td>
                <td class="nokp">${this.formatICDisplay(kir.no_kp)}</td>
                <td><span class="status-badge ${this.mapDatabaseStatusToUI(kir.status_rekod)}">${this.getStatusText(kir.status_rekod)}</span></td>
                <td class="date">${this.formatDate(kir.tarikh_cipta)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-edit" title="Edit KIR" onclick="senaraiKIRNew.editKIR('${kir.id}')">
                            <i class="icon-edit">✏️</i>
                            Edit
                        </button>
                        <button class="btn btn-sm btn-delete" title="Padam KIR" onclick="senaraiKIRNew.deleteKIR('${kir.id}')">
                            <i class="icon-delete">🗑️</i>
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Action handlers
    async viewKIR(kirId) {
        try {
            // Navigate to KIR Profile using the same method as original implementation
            this.navigateToKIRProfile(kirId, false, 'maklumat-asas');
        } catch (error) {
            console.error('Error viewing KIR:', error);
            this.showErrorMessage('Ralat membuka profil KIR.');
        }
    }

    navigateToKIRProfile(kirId, editMode = false, tab = 'maklumat-asas') {
        // Map tab parameter for KIR Profile route
        let profileTab = 'maklumat-asas';
        if (tab === 'air') {
            profileTab = 'air';
        } else if (tab === 'kesihatan') {
            profileTab = 'kesihatan';
        } else if (['maklumat-asas', 'kafa', 'pendidikan', 'pekerjaan', 'kekeluargaan', 'pkir'].includes(tab)) {
            profileTab = tab;
        }
        
        // Navigate to KIR Profile route
        window.location.hash = `#/admin/kir/${kirId}?tab=${profileTab}`;
    }

    editKIR(kirId) {
        // Navigate to KIR Profile in edit mode
        this.navigateToKIRProfile(kirId, true, 'maklumat-asas');
    }

    async deleteKIR(kirId) {
        const kir = this.currentKIRData.find(k => k.id === kirId);
        if (!kir) {
            this.showErrorMessage('KIR tidak dijumpai.');
            return;
        }

        const confirmMessage = `Adakah anda pasti ingin memadam KIR untuk:\n\nNama: ${kir.nama_penuh}\nNo. KP: ${this.formatICDisplay(kir.no_kp)}\n\nTindakan ini tidak boleh dibatalkan.`;
        
        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            this.showLoadingState();
            await KIRService.deleteKIR(kirId);
            this.showSuccessMessage(`KIR untuk ${kir.nama_penuh} telah berjaya dipadam.`);
            
            // Refresh the table
            await this.loadKIRData();
        } catch (error) {
            console.error('Error deleting KIR:', error);
            this.showErrorMessage('Ralat memadam KIR. Sila cuba lagi.');
        } finally {
            this.hideLoadingState();
        }
    }

    addAIR(kirId) {
        // Navigate to KIR Profile AIR tab
        this.navigateToKIRProfile(kirId, false, 'air');
    }

    updateHealth(kirId) {
        // Navigate to KIR Profile Health tab
        this.navigateToKIRProfile(kirId, false, 'kesihatan');
    }

    // Filter and search handlers
    handleSearch() {
        const searchInput = document.getElementById('kir-search-new');
        if (searchInput) {
            this.currentFilters.search = searchInput.value.trim();
            this.resetPaginationState();
            this.loadKIRData();
        }
    }

    handleFilterChange() {
        const statusFilter = document.getElementById('status-filter-new');
        const negeriFilter = document.getElementById('negeri-filter-new');
        
        if (statusFilter) this.currentFilters.status = statusFilter.value;
        if (negeriFilter) this.currentFilters.negeri = negeriFilter.value;
        
        this.resetPaginationState();
        this.loadKIRData();
    }

    resetFilters() {
        this.currentFilters = {
            search: '',
            status: 'all',
            negeri: 'all'
        };
        
        // Reset form elements
        const searchInput = document.getElementById('kir-search-new');
        const statusFilter = document.getElementById('status-filter-new');
        const negeriFilter = document.getElementById('negeri-filter-new');
        
        if (searchInput) searchInput.value = '';
        if (statusFilter) statusFilter.value = 'all';
        if (negeriFilter) negeriFilter.value = 'all';
        
        this.resetPaginationState();
        this.loadKIRData();
    }

    // Pagination handlers
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadKIRData();
        }
    }

    nextPage() {
        const nextCursor = this.pageCursors[this.currentPage + 1];
        if (nextCursor) {
            this.currentPage++;
            this.loadKIRData();
        }
    }

    // Utility methods
    updateTableInfo() {
        const tableInfo = document.getElementById('table-info-new');
        if (tableInfo) {
            const start = (this.currentPage - 1) * this.pageSize + 1;
            const end = start + this.currentKIRData.length - 1;
            const totalDisplay = this.hasMore ? `${end}+` : `${this.totalRecords}`;
            tableInfo.textContent = `Menunjukkan ${start}-${end} daripada ${totalDisplay} rekod`;
        }
    }

    updatePagination() {
        const totalPages = this.hasMore ? this.currentPage + 1 : this.currentPage;
        const paginationInfo = document.getElementById('pagination-info-new');
        const prevBtn = document.getElementById('prev-page-new');
        const nextBtn = document.getElementById('next-page-new');

        if (paginationInfo) {
            paginationInfo.textContent = `Halaman ${this.currentPage} daripada ${totalPages}`;
        }

        if (prevBtn) {
            prevBtn.disabled = this.currentPage <= 1;
        }

        if (nextBtn) {
            nextBtn.disabled = !this.pageCursors[this.currentPage + 1];
        }
    }

    showLoadingState() {
        const tableBody = document.getElementById('senariKirNewTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="table-loading-state">
                        <div class="table-loading">
                            <div class="loading-spinner"></div>
                            <span>Memuatkan data...</span>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    hideLoadingState() {
        // Loading state will be replaced by renderKIRTable()
    }

    showErrorMessage(message) {
        const errorDiv = document.getElementById('error-message-new');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            errorDiv.className = 'error-message show';
            
            setTimeout(() => {
                errorDiv.style.display = 'none';
                errorDiv.className = 'error-message';
            }, 5000);
        }
    }

    showSuccessMessage(message) {
        const errorDiv = document.getElementById('error-message-new');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            errorDiv.className = 'success-message show';
            
            setTimeout(() => {
                errorDiv.style.display = 'none';
                errorDiv.className = 'error-message';
            }, 3000);
        }
    }

    // Status mapping methods
    mapStatusToDatabase(uiStatus) {
        const statusMap = {
            'Draf': 'draft',
            'Dihantar': 'submitted', 
            'Disahkan': 'approved'
        };
        return statusMap[uiStatus] || uiStatus;
    }

    mapDatabaseStatusToUI(dbStatus) {
        const statusMap = {
            'draft': 'status-draft',
            'submitted': 'status-submitted',
            'approved': 'status-approved'
        };
        return statusMap[dbStatus] || 'status-unknown';
    }

    getStatusText(status) {
        const statusMap = {
            'draft': 'Draf',
            'submitted': 'Dihantar',
            'approved': 'Disahkan'
        };
        return statusMap[status] || status || 'Tidak Diketahui';
    }

    formatDate(dateString) {
        if (!dateString) return 'Tiada Tarikh';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ms-MY', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            return 'Tarikh Tidak Sah';
        }
    }

    // ========== CREATE KIR MODAL FUNCTIONS ==========

    /**
     * Show the Create KIR Modal
     */
    showCreateKIRModal() {
    const modal = document.getElementById('create-kir-modal');
    if (modal) {
        modal.style.display = 'flex';
        // Clear previous form data and errors
        this.clearCreateKIRForm();
        this.initializeIdentityTypeControls();
        // Focus on name input
        setTimeout(() => {
            const nameInput = document.getElementById('kir-nama');
            if (nameInput) nameInput.focus();
        }, 100);
    }
}

    /**
     * Close the Create KIR Modal
     */
    closeCreateKIRModal() {
    const modal = document.getElementById('create-kir-modal');
    if (modal) {
        modal.style.display = 'none';
        this.clearCreateKIRForm();
    }
}

    /**
     * Clear the Create KIR Form
     */
    clearCreateKIRForm() {
    const form = document.getElementById('create-kir-form');
    if (form) {
        form.reset();
        // Clear error messages
        document.getElementById('nama-error').textContent = '';
        document.getElementById('ic-error').textContent = '';
        // Remove error styling
        document.getElementById('kir-nama').classList.remove('error');
        document.getElementById('kir-ic').classList.remove('error');
        const nricRadio = document.querySelector('input[name="kir_identity_type"][value="nric"]');
        if (nricRadio) {
            nricRadio.checked = true;
        }
        this.applyIdentityTypeRules('nric');
    }
}

    /**
     * Validate IC Number format
     * @param {string} ic - IC number to validate
     * @returns {boolean} - True if valid format
     */
    validateICFormat(ic) {
    // Remove all non-digits for validation (matching backend logic)
    const cleanIC = ic.replace(/\D/g, '');
    
    // Check if it's exactly 12 digits
    if (!/^\d{12}$/.test(cleanIC)) {
        return false;
    }
    
    // Basic date validation (YYMMDD)
    const year = parseInt(cleanIC.substring(0, 2));
    const month = parseInt(cleanIC.substring(2, 4));
    const day = parseInt(cleanIC.substring(4, 6));
    
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    
    return true;
}

    /**
     * Format IC number by removing all non-digits to match backend normalization
     * @param {string} ic - IC number to format
     * @returns {string} - Formatted IC number (digits only)
     */
    formatICNumber(ic) {
        if (!ic) return '';
        const type = this.getSelectedIdentityType();
        return this.sanitizeIdentityValue(ic, type);
    }

    formatICDisplay(ic) {
        const formatted = formatICWithDashes(ic);
        if (formatted) {
            return formatted;
        }
        return ic || 'Tiada No. KP';
    }

    /**
     * Validate the Create KIR Form using the same validateKIR function as Cipta KIR
     * @returns {boolean} - True if form is valid
     */
    validateCreateKIRForm() {
        let isValid = true;
        
        // Get form elements
        const nameInput = document.getElementById('kir-nama');
        const icInput = document.getElementById('kir-ic');
        const nameError = document.getElementById('nama-error');
        const icError = document.getElementById('ic-error');
        
        // Clear previous errors
        nameError.textContent = '';
        icError.textContent = '';
        nameInput.classList.remove('error');
        icInput.classList.remove('error');
        
        // Validate name
        const name = nameInput.value.trim();
        if (!name) {
            nameError.textContent = 'Nama penuh diperlukan';
            nameInput.classList.add('error');
            isValid = false;
        } else if (name.length < 2) {
            nameError.textContent = 'Nama penuh mestilah sekurang-kurangnya 2 aksara';
            nameInput.classList.add('error');
            isValid = false;
        }
        
        const identityType = this.getSelectedIdentityType();
        const ic = icInput.value.trim();
        const normalizedIC = this.formatICNumber(ic);
        if (!normalizedIC) {
            icError.textContent = identityType === 'passport'
                ? 'Nombor passport diperlukan'
                : 'No. Kad Pengenalan diperlukan';
            icInput.classList.add('error');
            isValid = false;
        } else if (identityType === 'nric' && normalizedIC.length !== 12) {
            icError.textContent = 'Format No. Kad Pengenalan tidak sah (12 digit nombor sahaja)';
            icInput.classList.add('error');
            isValid = false;
        } else {
            try {
                const testData = { no_kp: normalizedIC };
                validateKIR(testData);
            } catch (error) {
                icError.textContent = identityType === 'passport'
                    ? 'Nombor passport tidak sah.'
                    : 'Format No. Kad Pengenalan tidak sah.';
                icInput.classList.add('error');
                isValid = false;
            }
        }
        
        return isValid;
    }

    /**
     * Submit the Create KIR Form
     */
    async submitCreateKIRForm() {
    // Validate form first
    if (!this.validateCreateKIRForm()) {
        return;
    }
    
    const submitBtn = document.getElementById('create-kir-submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    try {
        // Show loading state
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-flex';
        
        // Get form data
        const nameInput = document.getElementById('kir-nama');
        const icInput = document.getElementById('kir-ic');
        
        const identityType = this.getSelectedIdentityType();
        const formData = {
            nama_penuh: nameInput.value.trim(),
            no_kp: this.formatICNumber(icInput.value.trim()),
            identity_type: identityType,
            status_rekod: 'Draf'
        };
        
        console.log('Creating new KIR with data:', formData);
        
        // Create KIR using KIRService
        const result = await KIRService.createKIR(formData);
        
        console.log('KIR created successfully:', result);
        
        // Close modal
        this.closeCreateKIRModal();
        
        // Show success message
        this.showToast(`KIR untuk ${formData.nama_penuh} berjaya dicipta!`, 'success');
        
        // Refresh the KIR table
        await this.loadKIRData();
        
    } catch (error) {
        console.error('Error creating KIR:', error);
        
        // Handle specific error cases
        let errorMessage = 'Ralat mencipta KIR. Sila cuba lagi.';
        
        if (error.message.includes('No. KP already exists') || error.message.includes('already exists')) {
            errorMessage = 'No. Kad Pengenalan ini sudah wujud dalam sistem.';
            // Highlight IC field
            document.getElementById('kir-ic').classList.add('error');
            document.getElementById('ic-error').textContent = errorMessage;
        } else if (error.message.includes('No. KP is required')) {
            errorMessage = 'No. Kad Pengenalan diperlukan untuk mencipta KIR.';
        }
        
        this.showToast(errorMessage, 'error');
        
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
  }

    getSelectedIdentityType() {
        const radio = document.querySelector('input[name="kir_identity_type"]:checked');
        return radio?.value || 'nric';
    }

    sanitizeIdentityValue(value, type = 'nric') {
        const raw = (value || '').toString();
        if (type === 'passport') {
            return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
        }
        return raw.replace(/\D/g, '').slice(0, 12);
    }

    formatNRICForInput(value = '') {
        const digits = value.replace(/\D/g, '').slice(0, 12);
        if (digits.length <= 6) return digits;
        if (digits.length <= 8) return `${digits.slice(0, 6)}-${digits.slice(6)}`;
        return `${digits.slice(0, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
    }

    applyIdentityTypeRules(type = 'nric') {
        const icInput = document.getElementById('kir-ic');
        if (!icInput) return;

        if (type === 'passport') {
            icInput.removeAttribute('maxlength');
            icInput.placeholder = 'Contoh: A1234567';
            icInput.inputMode = 'text';
            icInput.dataset.identityType = 'passport';
        } else {
            icInput.setAttribute('maxlength', '14');
            icInput.placeholder = '123456-12-1234';
            icInput.inputMode = 'numeric';
            icInput.dataset.identityType = 'nric';
        }
    }

    initializeIdentityTypeControls() {
        const icInput = document.getElementById('kir-ic');
        if (!icInput) return;

        if (!icInput.dataset.identityListener) {
            icInput.addEventListener('input', (event) => {
                const type = this.getSelectedIdentityType();
                if (type === 'passport') {
                    event.target.value = this.sanitizeIdentityValue(event.target.value, 'passport');
                } else {
                    const digits = this.sanitizeIdentityValue(event.target.value, 'nric');
                    event.target.value = this.formatNRICForInput(digits);
                }
            });
            icInput.dataset.identityListener = 'true';
        }

        const identityRadios = document.querySelectorAll('input[name="kir_identity_type"]');
        identityRadios.forEach(radio => {
            if (radio.dataset.identityListener) return;
            radio.addEventListener('change', () => {
                if (!radio.checked) return;
                this.applyIdentityTypeRules(radio.value);
                const icInputEl = document.getElementById('kir-ic');
                if (!icInputEl) return;
                icInputEl.value = radio.value === 'passport'
                    ? this.sanitizeIdentityValue(icInputEl.value, 'passport')
                    : this.formatNRICForInput(this.sanitizeIdentityValue(icInputEl.value, 'nric'));
            });
            radio.dataset.identityListener = 'true';
        });

        this.applyIdentityTypeRules(this.getSelectedIdentityType());
    }

    /**
     * Show toast message
     * @param {string} message - Message to show
     * @param {string} type - Type of message ('success' or 'error')
     */
    showToast(message, type = 'success') {
    const toast = document.getElementById('toast-message');
    const toastIcon = toast.querySelector('.toast-icon');
    const toastText = toast.querySelector('.toast-text');
    
    if (toast && toastIcon && toastText) {
        // Set message and icon
        toastText.textContent = message;
        toastIcon.textContent = type === 'success' ? '✅' : '❌';
        
        // Set toast class
        toast.className = `toast-message toast-${type}`;
        
        // Show toast
        toast.style.display = 'block';
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            toast.style.display = 'none';
        }, 5000);
    }
}

}

// Make instance globally available for action buttons
window.senaraiKIRNew = null;
