import { invoke } from "$lib/tauri";

export class SalaryHistoryState {
  history = $state<any[]>([]);
  isLoading = $state(true);
  
  // Pagination State
  page = $state(0);
  limit = 8; // Show 8 per page
  hasMore = $state(true);
  isLoadingMore = $state(false);

  // Custom Confirmation Modal State
  showDeleteConfirmModal = $state(false);
  showErrorModal = $state(false);
  errorMessage = $state("");
  pendingDeleteId = $state<number | null>(null);

  constructor() {
    this.refreshHistory();
  }

  // Reload completely
  refreshHistory = async () => {
    this.page = 0;
    this.hasMore = true;
    this.history = [];
    await this.loadMore();
  };

  loadMore = async () => {
    if (!this.hasMore) return;
    
    if (this.page === 0) {
      this.isLoading = true;
    } else {
      this.isLoadingMore = true;
    }

    try {
      const data: any[] = await invoke("get_salary_history", { 
        limit: this.limit, 
        offset: this.page * this.limit 
      });
      
      if (data && data.length > 0) {
        if (this.page === 0) {
          this.history = data;
        } else {
          this.history = [...this.history, ...data];
        }
        
        // If we got exactly the limit, there might be more. Else, we've reached the end.
        this.hasMore = data.length === this.limit;
        this.page += 1;
      } else {
        this.hasMore = false;
        if (this.page === 0) this.history = [];
      }
    } catch (e) {
      console.error("Error loading salary history", e);
      if (this.page === 0) this.history = [];
    } finally {
      this.isLoading = false;
      this.isLoadingMore = false;
    }
  };

  deleteRecord = (id: number) => {
    if (this.history.length === 0) return;
    
    const mostRecentId = this.history[0].id;
    if (id !== mostRecentId) {
      this.errorMessage = "Solo puedes eliminar el último registro salarial agregado.";
      this.showErrorModal = true;
      return;
    }

    this.pendingDeleteId = id;
    this.showDeleteConfirmModal = true;
  };

  confirmDelete = async () => {
    if (this.pendingDeleteId === null) return;
    try {
      await invoke("delete_salary_record", { id: this.pendingDeleteId });
      await this.refreshHistory();
    } catch (e) {
      console.error("Failed to delete record", e);
    } finally {
      this.showDeleteConfirmModal = false;
      this.pendingDeleteId = null;
    }
  };

  cancelDelete = () => {
    this.showDeleteConfirmModal = false;
    this.pendingDeleteId = null;
  };
}
