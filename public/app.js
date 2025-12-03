// Indonesian name generator
const indonesianFirstNames = [
  "budi", "siti", "agus", "dewi", "eko", "rina", "fajar", "dian", "rizky", "nur",
  "andi", "maya", "hendra", "sari", "joko", "putri", "bayu", "fitri", "dimas", "angga",
  "wati", "bambang", "yuni", "doni", "indah", "reza", "kartika", "ahmad", "susanti", "pratama"
];

const indonesianLastNames = [
  "santoso", "pratama", "wijaya", "kusuma", "hidayat", "saputra", "wulandari", "nugroho",
  "siregar", "nasution", "putra", "dewi", "pertiwi", "permata", "cahyono", "rahman",
  "hakim", "fauzi", "subekti", "marlina", "handoko", "susilo", "fitriani", "rahmawati"
];

function generateIndonesianName() {
  const firstName = indonesianFirstNames[Math.floor(Math.random() * indonesianFirstNames.length)];
  const lastName = indonesianLastNames[Math.floor(Math.random() * indonesianLastNames.length)];
  const randomSuffix = Math.random().toString(36).substring(2, 5);
  return `${firstName}${lastName}${randomSuffix}`;
}

// Alpine.js component
function emailRoutingManager() {
  return {
    // State
    configs: [],
    selectedConfig: '',
    zones: [],
    selectedZone: '',
    emailList: [],
    isLoading: false,
    isAutoMode: true,
    manualAlias: '',
    destinationEmail: '',
    customEmail: '',
    copiedId: null,
    darkMode: false,
    configStatus: 'checking',
    showConfigModal: false,
    showAddConfigForm: false,
    editingConfig: null,
    isSaving: false,
    configForm: {
      name: '',
      apiToken: '',
      accountId: '',
      d1Database: '',
      workerApi: '',
      kvStorage: '',
      destinationEmails: []
    },
    toast: {
      show: false,
      message: '',
      type: 'success'
    },

    // Computed
    get selectedConfigData() {
      return this.configs.find(c => c.id === this.selectedConfig);
    },
    get selectedZoneData() {
      return this.zones.find(z => z.id === this.selectedZone);
    },

    // Methods
    async init() {
      // Load saved preferences
      this.darkMode = localStorage.getItem('darkMode') === 'true';
      this.applyDarkMode();
      
      // Load initial data
      await this.loadConfigs();
      await this.loadEmailList();
      
      // Auto-select first config if available
      if (this.configs.length > 0 && !this.selectedConfig) {
        this.selectedConfig = this.configs[0].id;
        await this.loadZones();
      }
    },

    applyDarkMode() {
      if (this.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },

    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      localStorage.setItem('darkMode', this.darkMode.toString());
      this.applyDarkMode();
    },

    async apiCall(url, options = {}) {
      try {
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          },
          ...options
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Request failed');
        }
        
        return data;
      } catch (error) {
        this.showToast(error.message, 'error');
        throw error;
      }
    },

    async loadConfigs() {
      try {
        this.isLoading = true;
        const data = await this.apiCall('/api/configs');
        this.configs = data.configs || [];
        this.configStatus = this.configs.length > 0 ? 'configured' : 'not-configured';
      } catch (error) {
        this.configStatus = 'not-configured';
      } finally {
        this.isLoading = false;
      }
    },

    async loadZones() {
      if (!this.selectedConfig) return;
      
      try {
        this.isLoading = true;
        const data = await this.apiCall(`/api/zones?configId=${this.selectedConfig}`);
        this.zones = data.zones || [];
        
        if (this.zones.length > 0 && !this.selectedZone) {
          this.selectedZone = this.zones[0].id;
        }
      } catch (error) {
        console.error('Failed to load zones:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async loadEmailList() {
      try {
        const url = this.selectedConfig 
          ? `/api/email-routing?configId=${this.selectedConfig}`
          : '/api/email-routing';
        const data = await this.apiCall(url);
        this.emailList = data.emails || [];
      } catch (error) {
        console.error('Failed to load email list:', error);
      }
    },

    async createEmailRouting() {
      const finalDestinationEmail = this.destinationEmail === 'custom' ? this.customEmail : this.destinationEmail;
      
      if (!this.selectedConfig || !this.selectedZone || !finalDestinationEmail) {
        this.showToast('Pilih konfigurasi, domain dan masukkan email tujuan', 'error');
        return;
      }

      const aliasPart = this.isAutoMode ? generateIndonesianName() : this.manualAlias;
      if (!aliasPart) {
        this.showToast('Masukkan alias email', 'error');
        return;
      }

      try {
        this.isLoading = true;
        await this.apiCall('/api/email-routing', {
          method: 'POST',
          body: JSON.stringify({
            cloudflareConfigId: this.selectedConfig,
            zoneId: this.selectedZone,
            aliasPart,
            destinationEmail: finalDestinationEmail
          })
        });
        
        this.showToast('Email routing berhasil dibuat!', 'success');
        this.manualAlias = '';
        this.customEmail = '';
        this.destinationEmail = '';
        await this.loadEmailList();
      } catch (error) {
        // Error already handled by apiCall
      } finally {
        this.isLoading = false;
      }
    },

    async deleteEmailRouting(id, ruleId) {
      if (!confirm('Apakah Anda yakin ingin menghapus email routing ini?')) {
        return;
      }

      try {
        this.isLoading = true;
        await this.apiCall(`/api/email-routing/${id}`, {
          method: 'DELETE',
          body: JSON.stringify({ ruleId })
        });
        
        this.showToast('Email routing berhasil dihapus!', 'success');
        await this.loadEmailList();
      } catch (error) {
        // Error already handled by apiCall
      } finally {
        this.isLoading = false;
      }
    },

    async saveConfig() {
      try {
        this.isSaving = true;
        const url = this.editingConfig ? '/api/configs' : '/api/configs';
        const method = this.editingConfig ? 'PUT' : 'POST';
        const payload = this.editingConfig 
          ? { ...this.configForm, id: this.editingConfig.id }
          : this.configForm;

        await this.apiCall(url, {
          method,
          body: JSON.stringify(payload)
        });
        
        this.showToast(
          this.editingConfig ? 'Konfigurasi berhasil diperbarui!' : 'Konfigurasi berhasil ditambahkan!',
          'success'
        );
        
        this.showAddConfigForm = false;
        this.editingConfig = null;
        this.resetConfigForm();
        await this.loadConfigs();
      } catch (error) {
        // Error already handled by apiCall
      } finally {
        this.isSaving = false;
      }
    },

    async deleteConfig(id) {
      if (!confirm('Apakah Anda yakin ingin menonaktifkan konfigurasi ini?')) {
        return;
      }

      try {
        await this.apiCall(`/api/configs?id=${id}`, {
          method: 'DELETE'
        });
        
        this.showToast('Konfigurasi berhasil dinonaktifkan', 'success');
        await this.loadConfigs();
      } catch (error) {
        // Error already handled by apiCall
      }
    },

    editConfig(config) {
      this.editingConfig = config;
      this.configForm = {
        name: config.name,
        apiToken: config._full.apiToken,
        accountId: config._full.accountId,
        d1Database: config._full.d1Database,
        workerApi: config._full.workerApi,
        kvStorage: config._full.kvStorage,
        destinationEmails: config._full.destinationEmails
      };
      this.showAddConfigForm = true;
    },

    resetConfigForm() {
      this.configForm = {
        name: '',
        apiToken: '',
        accountId: '',
        d1Database: '',
        workerApi: '',
        kvStorage: '',
        destinationEmails: []
      };
    },

    copyToClipboard(text, id) {
      navigator.clipboard.writeText(text);
      this.copiedId = id;
      this.showToast('Email disalin ke clipboard', 'success');
      setTimeout(() => {
        this.copiedId = null;
      }, 2000);
    },

    showToast(message, type = 'success') {
      this.toast = {
        show: true,
        message,
        type
      };
      
      setTimeout(() => {
        this.toast.show = false;
      }, 3000);
    },

    // Helper method for template
    generateIndonesianName
  };
}