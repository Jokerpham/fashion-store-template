/* Lá cờ cho từng ngôn ngữ (v7-flags) — file SVG tự chứa trong
   public/flags/ (tải từ flagcdn, không phụ thuộc runtime, không cần
   thêm thư viện). Dùng <img> thay vì emoji cờ vì Chrome trên Windows
   hiện emoji cờ thành 2 chữ cái (VD "US") thay vì hình lá cờ.
   flag = mã quốc gia ISO ("gb" cho tiếng Anh, "vn" cho tiếng Việt). */
export default function FlagIcon({
  flag,
  className = "h-3.5 w-5",
}: {
  flag: string;
  className?: string;
}) {
  return (
    <img
      src={`/flags/${flag}.svg`}
      alt=""
      aria-hidden="true"
      loading="lazy"
      draggable={false}
      className={`shrink-0 rounded-[2px] object-cover ${className}`}
    />
  );
}
