import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserInfo } from "./types";
import { GENDERS } from "./constants";

interface UserInfoFormProps {
  userInfo: UserInfo;
  onUserInfoChange: (field: keyof UserInfo, value: string) => void;
}

export const UserInfoForm = ({ userInfo, onUserInfoChange }: UserInfoFormProps) => {
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = 1950;
    return Array.from({ length: currentYear - startYear + 1 }, (_, i) => (currentYear - i).toString());
  }, []);

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => (i + 1).toString()), []);

  const days = useMemo(() => {
    if (!userInfo.dobYear || !userInfo.dobMonth) return Array.from({ length: 31 }, (_, i) => (i + 1).toString());
    const daysInMonth = new Date(parseInt(userInfo.dobYear), parseInt(userInfo.dobMonth), 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());
  }, [userInfo.dobMonth, userInfo.dobYear]);

  return (
    <div className="space-y-4 p-6 border rounded-lg">
      <h3 className="text-xl font-semibold">Thông tin cá nhân</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="fullName">Họ và tên</Label>
          <Input id="fullName" value={userInfo.fullName} onChange={(e) => onUserInfoChange('fullName', e.target.value)} placeholder="Nguyễn Văn A" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Số điện thoại</Label>
          <Input id="phone" type="tel" value={userInfo.phone} onChange={(e) => onUserInfoChange('phone', e.target.value)} placeholder="09xxxxxxxx" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="workplace">Đơn vị công tác</Label>
          <Input id="workplace" value={userInfo.workplace} onChange={(e) => onUserInfoChange('workplace', e.target.value)} placeholder="Trạm Y tế phường Mỹ Thượng" required />
        </div>
        <div className="space-y-2">
          <Label>Ngày sinh</Label>
          <div className="grid grid-cols-3 gap-2">
            <Select value={userInfo.dobDay} onValueChange={(value) => onUserInfoChange('dobDay', value)}>
              <SelectTrigger><SelectValue placeholder="Ngày" /></SelectTrigger>
              <SelectContent>{days.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={userInfo.dobMonth} onValueChange={(value) => onUserInfoChange('dobMonth', value)}>
              <SelectTrigger><SelectValue placeholder="Tháng" /></SelectTrigger>
              <SelectContent>{months.map(month => <SelectItem key={month} value={month}>{month}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={userInfo.dobYear} onValueChange={(value) => onUserInfoChange('dobYear', value)}>
              <SelectTrigger><SelectValue placeholder="Năm" /></SelectTrigger>
              <SelectContent>{years.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Giới tính</Label>
          <RadioGroup value={userInfo.gender} onValueChange={(value) => onUserInfoChange('gender', value)} className="flex items-center space-x-4 pt-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={GENDERS.MALE} id="gender-male" />
              <Label htmlFor="gender-male">{GENDERS.MALE}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={GENDERS.FEMALE} id="gender-female" />
              <Label htmlFor="gender-female">{GENDERS.FEMALE}</Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </div>
  );
};