import axiosClient from "@/lib/axios-client";
import type { ApiResponse, PageResponse } from "@/types/api.type";
import type { ComplaintAction, ComplaintCase } from "@/types/complaint.type";
export const adminComplaintService = {
  async list(params:{status?:string;category?:string;overdue?:boolean;page:number}) {
    return (await axiosClient.get<PageResponse<ComplaintCase>>("/api/v1/admin/complaints",{params:{...params,size:20}})).data;
  },
  async get(id:string){return (await axiosClient.get<ApiResponse<ComplaintCase>>("/api/v1/admin/complaints/"+encodeURIComponent(id))).data.result;},
  async act(id:string,action:string,payload:ComplaintAction){return (await axiosClient.post<ApiResponse<ComplaintCase>>("/api/v1/admin/complaints/"+encodeURIComponent(id)+"/actions/"+action,payload)).data.result;},
};
