import { useEffect, useState } from "react";
import type { CreateListingRequest, ListingMediaResponse } from "@/types/listing.type";
import * as labels from "@/utils/listing-labels";
import storageService from "@/services/storage.service";
import AdminMediaViewer from "./AdminMediaViewer";

const names: Record<string,string> = {
  areaM2:"Diện tích (m²)",availableFrom:"Có thể nhận từ",pricing:"Giá và điều kiện thuê",amount:"Số tiền",
  unit:"Đơn vị",currency:"Tiền tệ",negotiable:"Có thể thương lượng",depositType:"Loại đặt cọc",
  depositAmount:"Tiền cọc",depositMonths:"Số tháng cọc",paymentCycle:"Chu kỳ thanh toán",minimumLeaseMonths:"Thuê tối thiểu (tháng)",managementFeeIncluded:"Đã gồm phí quản lý",
  apartmentDetail:"Thông tin căn hộ",houseDetail:"Thông tin nhà",roomDetail:"Thông tin phòng",officeDetail:"Thông tin văn phòng",commercialDetail:"Thông tin mặt bằng",
  projectName:"Dự án",buildingBlock:"Tòa nhà",unitCode:"Mã căn",roomCode:"Mã phòng",floorNumber:"Tầng",buildingTotalFloors:"Tổng tầng",totalFloors:"Tổng tầng",
  bedroomCount:"Phòng ngủ",bathroomCount:"Phòng tắm",livingRoomCount:"Phòng khách",kitchenCount:"Bếp",furnishingStatus:"Nội thất",mainDoorDirection:"Hướng cửa",balconyDirection:"Hướng ban công",viewDescription:"Tầm nhìn",maxOccupants:"Số người tối đa",maxVehicles:"Số xe tối đa",maxMotorbikeCount:"Xe máy tối đa",maxCarCount:"Ô tô tối đa",legalStatus:"Pháp lý",
  landAreaM2:"Diện tích đất (m²)",frontageWidthM:"Mặt tiền (m)",lengthM:"Chiều dài (m)",accessRoadWidthM:"Đường vào (m)",roadWidthM:"Đường rộng (m)",frontageCount:"Số mặt tiền",hasRooftop:"Sân thượng",hasGarage:"Gara",accessType:"Lối đi",rentalScopeDescription:"Phạm vi thuê",rentedFloorFrom:"Thuê từ tầng",rentedFloorTo:"Đến tầng",
  restroomType:"Nhà vệ sinh",kitchenType:"Khu vực bếp",hasWindow:"Cửa sổ",balconyType:"Ban công",hasMezzanine:"Gác lửng",accessHoursType:"Giờ ra vào",electricMeterType:"Đồng hồ điện",waterMeterType:"Đồng hồ nước",parkingPolicy:"Giữ xe",
  amenityCodes:"Tiện ích",customAmenities:"Tiện ích khác",furnishings:"Tài sản bàn giao",assetName:"Tên tài sản",quantity:"Số lượng",handoverCondition:"Hiện trạng",conditionNote:"Ghi chú hiện trạng",
  charges:"Các khoản phí",chargeType:"Khoản phí",billingMethod:"Cách tính",includedInRent:"Đã gồm trong giá thuê",customName:"Tên phí",description:"Mô tả",policies:"Nội quy",code:"Chính sách",value:"Quy định",note:"Ghi chú",viewingDays:"Ngày xem nhà",viewingSlots:"Khung giờ xem nhà",
  buildingName:"Tòa nhà",officeGrade:"Hạng văn phòng",handoverStatus:"Bàn giao",expectedSeats:"Số chỗ ngồi",minimumDivisibleAreaM2:"Diện tích nhỏ nhất",restroomCount:"Số WC",pantryType:"Bếp",carParkingCapacity:"Chỗ ô tô",motorbikeParkingCapacity:"Chỗ xe máy",operatingMode:"Thời gian hoạt động",operatingHours:"Lịch hoạt động",dayOfWeek:"Ngày",openTime:"Mở cửa",closeTime:"Đóng cửa",positionType:"Vị trí",rentedFloorCount:"Số tầng thuê",parkingType:"Loại chỗ xe",hasThreePhasePower:"Điện ba pha",hasStandardFireSafety:"PCCC",operatingHoursDescription:"Giờ hoạt động",restrictedBusinesses:"Ngành bị hạn chế",loadingAreaDescription:"Bốc dỡ hàng",
};
const enums:Record<string,Record<string,string>> = {
  unit:labels.PRICING_UNIT_NAMES,depositType:labels.DEPOSIT_TYPE_NAMES,paymentCycle:labels.PAYMENT_CYCLE_NAMES,
  furnishingStatus:labels.FURNISHING_NAMES,restroomType:labels.RESTROOM_TYPE_NAMES,kitchenType:labels.KITCHEN_TYPE_NAMES,
  balconyType:labels.BALCONY_TYPE_NAMES,accessType:labels.ACCESS_TYPE_NAMES,electricMeterType:labels.METER_TYPE_NAMES,waterMeterType:labels.METER_TYPE_NAMES,
  chargeType:labels.CHARGE_TYPE_NAMES,billingMethod:labels.BILLING_METHOD_NAMES,legalStatus:labels.LEGAL_STATUS_NAMES,
  mainDoorDirection:labels.DIRECTION_NAMES,balconyDirection:labels.DIRECTION_NAMES,
  viewingDays:labels.DAY_LABELS,viewingSlots:labels.SLOT_LABELS,dayOfWeek:labels.DAY_LABELS,
  handoverCondition:{BRAND_NEW:"Mới 100%",GOOD:"Còn tốt",NORMAL:"Bình thường",USED_ACCEPTABLE:"Cũ, còn dùng được",MINOR_DAMAGE:"Hư hỏng nhẹ"},
  accessHoursType:{FLEXIBLE:"Tự do",CURFEW:"Có giờ đóng cửa"},parkingPolicy:{NONE:"Không giữ xe",FREE:"Miễn phí",PAID:"Có thu phí"},
};
function valueText(key:string,value:unknown):string {
  if(typeof value === "boolean") return value?"Có":"Không";
  if(typeof value === "number") return value.toLocaleString("vi-VN");
  if(typeof value === "string") return enums[key]?.[value] ?? value;
  return "—";
}
function Fields({value,field=""}:{value:unknown;field?:string}) {
  if(Array.isArray(value)) return value.length?<div className="space-y-2">{value.map((row,i)=><div key={i} className="rounded border p-2"><Fields value={row} field={field}/></div>)}</div>:<span>Không có</span>;
  if(value && typeof value === "object") return <dl className="divide-y">{Object.entries(value).filter(([key,v])=>names[key]&&v!==null&&v!==undefined).map(([key,v])=><div key={key} className="grid gap-2 py-2 sm:grid-cols-[12rem_1fr]"><dt className="text-muted-foreground">{names[key]}</dt><dd className="min-w-0 whitespace-pre-wrap break-words"><Fields value={v} field={key}/></dd></div>)}</dl>;
  return <span>{valueText(field,value)}</span>;
}
export default function PendingListingContent({edit,address}:{edit:CreateListingRequest;address?:string|null}) {
  const [loaded,setLoaded]=useState<{edit:CreateListingRequest;media:ListingMediaResponse[];error:boolean}|null>(null);
  const media=loaded?.edit===edit?loaded.media:[];
  const mediaError=loaded?.edit===edit&&loaded.error;
  useEffect(()=>{
    let current=true;
    void Promise.allSettled(edit.media.map(async m=>({...m,id:m.storageObjectId,url:await storageService.getViewUrl(m.storageObjectId),contentType:m.mediaType==="IMAGE"?"image/jpeg":"video/mp4",sizeBytes:0})))
      .then(rows=>{if(current)setLoaded({edit,media:rows.flatMap(row=>row.status==="fulfilled"?[row.value]:[]),error:rows.some(row=>row.status==="rejected")});});
    return ()=>{current=false;};
  },[edit]);
  return <div className="mt-3 space-y-3">
    <p className="whitespace-pre-wrap break-words"><span className="font-semibold">Địa chỉ đề xuất: </span>{address??"Chưa đối chiếu được địa chỉ. Tải lại để kiểm tra trước khi duyệt."}</p>
    <Fields value={edit}/>
    {mediaError&&<p role="alert" className="text-destructive">Một số ảnh/video chưa tải được. Tải lại trang để kiểm tra đủ trước khi duyệt.</p>}
    <AdminMediaViewer media={media} title={edit.title}/>
  </div>;
}
