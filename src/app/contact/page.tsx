"use client";
import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  pushMessage,
  newId,
  fetchMessagesByEmail,
  fetchReplies,
  postReply,
  type ContactMessage,
  type MessageReply,
} from "@/lib/store";

/* Tra cứu tin nhắn đã gửi: khách nhập đúng email đã dùng gửi tin để xem
   trả lời của shop và nhắn tiếp — không cần đăng nhập, mọi thứ lưu trong
   CSDL như tin nhắn gốc. */
function ContactChatLookup() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [looking, setLooking] = useState(false);
  const [lookedUp, setLookedUp] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [found, setFound] = useState<ContactMessage[]>([]);
  const [openMsg, setOpenMsg] = useState<ContactMessage | null>(null);
  const [replies, setReplies] = useState<MessageReply[]>([]);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState("");

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const mail = email.trim();
    if (!mail || looking) return;
    setLooking(true);
    setLookupError("");
    setOpenMsg(null);
    try {
      setFound(await fetchMessagesByEmail(mail));
      setLookedUp(true);
    } catch {
      setLookupError(t("contact.lookupError"));
    } finally {
      setLooking(false);
    }
  };

  const openThread = async (msg: ContactMessage) => {
    setOpenMsg(msg);
    setReplyBody("");
    setReplyError("");
    try {
      setReplies(await fetchReplies(msg.id));
    } catch {
      setReplies([]);
    }
  };

  const sendReply = async () => {
    if (!openMsg || sending) return;
    const text = replyBody.trim();
    if (!text) return;
    setSending(true);
    setReplyError("");
    try {
      const created = await postReply(openMsg.id, "customer", text);
      setReplies((prev) => [...prev, created]);
      setReplyBody("");
    } catch {
      setReplyError(t("contact.replyError"));
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="container-x py-14">
      <div className="max-w-3xl mx-auto bg-[#f5f6f7] px-8 py-10">
        <h2 className="text-2xl font-light text-neutral-900">{t("contact.lookupTitle")}</h2>
        <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
          {t("contact.lookupText")}
        </p>

        <form onSubmit={lookup} className="mt-6 flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("footer.yourEmail")}
            className="flex-1 bg-white border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-black placeholder:text-neutral-500"
          />
          <button
            type="submit"
            disabled={looking}
            className="bg-[#171a21] text-white px-6 py-3 text-sm tracking-wide font-heading hover:bg-black transition disabled:opacity-50"
          >
            {looking ? t("contact.searching") : t("contact.viewMyMessages")}
          </button>
        </form>
        {lookupError && <p className="text-sm text-red-600 mt-3">{lookupError}</p>}

        {lookedUp && !openMsg && (
          <div className="mt-8">
            {found.length === 0 ? (
              <p className="text-sm text-neutral-500">{t("contact.noMessages")}</p>
            ) : (
              <ul className="divide-y divide-neutral-200 bg-white border border-neutral-200">
                {found.map((m) => (
                  <li key={m.id}>
                    <button onClick={() => openThread(m)} className="w-full text-left px-5 py-4 hover:bg-neutral-50">
                      <span className="block font-medium text-sm">{m.subject || t("contact.noSubject")}</span>
                      <span className="block text-xs text-neutral-500 mt-1">
                        {new Date(m.date).toLocaleString("vi-VN")}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {openMsg && (
          <div className="mt-8 bg-white border border-neutral-200 p-5 md:p-6">
            <button onClick={() => setOpenMsg(null)} className="text-sm underline">
              {t("contact.backToList")}
            </button>
            <p className="font-medium mt-4">{openMsg.subject || t("contact.noSubject")}</p>
            <p className="text-xs text-neutral-500 mt-1">
              {openMsg.name} · {new Date(openMsg.date).toLocaleString("vi-VN")}
            </p>

            <div className="mt-5 space-y-3">
              <div className="max-w-[85%] bg-neutral-100 rounded px-4 py-3">
                <p className="text-xs font-medium opacity-70">{openMsg.name}</p>
                <p className="text-sm leading-relaxed mt-1 whitespace-pre-line">{openMsg.message}</p>
              </div>
              {replies.map((r) => (
                <div
                  key={r.id}
                  className={`max-w-[85%] rounded px-4 py-3 ${
                    r.sender === "admin"
                      ? "bg-neutral-100 text-neutral-900"
                      : "ml-auto bg-black text-white"
                  }`}
                >
                  <p className="text-xs font-medium opacity-70">
                    {r.sender === "admin" ? "Fashion Store" : openMsg.name} ·{" "}
                    {new Date(r.date).toLocaleString("vi-VN")}
                  </p>
                  <p className="text-sm leading-relaxed mt-1 whitespace-pre-line">{r.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder={t("contact.replyPlaceholder")}
                rows={3}
                className="w-full border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-black resize-y"
              />
              {replyError && <p className="text-sm text-red-600 mt-2">{replyError}</p>}
              <button
                onClick={sendReply}
                disabled={sending || !replyBody.trim()}
                className="bg-[#171a21] text-white px-6 py-3 text-sm mt-3 hover:bg-black transition disabled:opacity-50"
              >
                {sending ? t("contact.sending") : t("contact.send")}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default function ContactPage() {
  const { t } = useLanguage();
  const [sent, setSent] = useState(false);

  return (
    <div className="bg-white">
      {/* ===== Hero: đèn treo + chữ Liên hệ (đúng ảnh mẫu) ===== */}
      <section className="relative h-[380px] md:h-[520px] bg-[#e4e9ec] overflow-hidden flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/site/contact-hero.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <h1 className="relative font-heading font-thin text-6xl md:text-8xl tracking-wide text-[#20242e]">
          {t("contact.title")}
        </h1>
      </section>

      {/* ===== Giới thiệu ===== */}
      <section className="container-x pt-14 pb-6">
        <p className="max-w-3xl mx-auto text-center text-neutral-500 leading-relaxed">
          {t("contact.intro")}
        </p>
      </section>

      {/* ===== Địa chỉ / Điện thoại / Email ===== */}
      <section className="container-x pb-14">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex items-start gap-6">
            <span className="text-2xl w-8 text-center" aria-hidden>⌂</span>
            <span className="w-32 shrink-0 text-[13px] font-medium tracking-wide text-neutral-600 pt-1">
              {t("contact.addressLabel")}
            </span>
            <span className="text-[15px] text-neutral-900">
              123 Đường Lê Lợi, Quận 1, Thành phố Hồ Chí Minh
            </span>
          </div>
          <div className="flex items-start gap-6">
            <span className="text-2xl w-8 text-center" aria-hidden>☎</span>
            <span className="w-32 shrink-0 text-[13px] font-medium tracking-wide text-neutral-600 pt-1">
              {t("contact.phoneLabel1")}<br />{t("contact.phoneLabel2")}
            </span>
            <a href="tel:0123456789" className="text-[15px] text-neutral-900 pt-1 hover:underline">
              0123 456 789
            </a>
          </div>
          <div className="flex items-start gap-6">
            <span className="text-2xl w-8 text-center" aria-hidden>✉</span>
            <span className="w-32 shrink-0 text-[13px] font-medium tracking-wide text-neutral-600 pt-1">
              EMAIL
            </span>
            <a href="mailto:info@fashionstore.global" className="text-[15px] text-neutral-900 pt-1 hover:underline">
              info@fashionstore.global
            </a>
          </div>
        </div>
      </section>

      {/* ===== Bản đồ + Form liên hệ ===== */}
      <section className="grid md:grid-cols-2">
        <div className="min-h-[420px] bg-neutral-200">
          <iframe
            title="Bản đồ Fashion Store - 123 Đường Lê Lợi, Quận 1, TP.HCM"
            src="https://www.google.com/maps?q=123%20%C4%90%C6%B0%E1%BB%9Dng%20L%C3%AA%20L%E1%BB%A3i%2C%20Qu%E1%BA%ADn%201%2C%20TP.HCM&output=embed"
            className="w-full h-full min-h-[420px] border-0"
            loading="lazy"
          />
        </div>

        <div className="relative bg-[#f5f6f7] px-8 py-12 md:px-16">
          <h2 className="text-3xl font-light text-neutral-900">{t("contact.formTitle")}</h2>

          {sent ? (
            <div className="mt-10 bg-white border border-emerald-200 p-6">
              <p className="font-medium text-emerald-700">{t("contact.sentTitle")}</p>
              <p className="text-sm text-neutral-500 mt-2">
                {t("contact.sentText")}
              </p>
              <button onClick={() => setSent(false)} className="text-sm underline mt-4">
                {t("contact.sendAnother")}
              </button>
            </div>
          ) : (
            <form
              className="mt-8 space-y-7"
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                try {
                  await pushMessage({
                    id: newId("MSG"),
                    date: new Date().toISOString(),
                    name: String(fd.get("name") || ""),
                    email: String(fd.get("email") || ""),
                    subject: String(fd.get("subject") || ""),
                    message: String(fd.get("message") || ""),
                    read: false,
                  });
                  setSent(true);
                } catch {
                  alert(t("contact.sendFailed"));
                }
              }}
            >
              <div>
                <label htmlFor="ct-name" className="sr-only">{t("contact.nameLabel")}</label>
                <input id="ct-name" name="name" required placeholder={t("contact.nameLabel")}
                  className="w-full bg-transparent border-b border-neutral-300 focus:border-black outline-none py-3 placeholder:text-neutral-500" />
              </div>
              <div>
                <label htmlFor="ct-email" className="sr-only">Email</label>
                <input id="ct-email" name="email" type="email" required placeholder="Email"
                  className="w-full bg-transparent border-b border-neutral-300 focus:border-black outline-none py-3 placeholder:text-neutral-500" />
              </div>
              <div>
                <label htmlFor="ct-subject" className="sr-only">{t("contact.subjectLabel")}</label>
                <input id="ct-subject" name="subject" placeholder={t("contact.subjectLabel")}
                  className="w-full bg-transparent border-b border-neutral-300 focus:border-black outline-none py-3 placeholder:text-neutral-500" />
              </div>
              <div>
                <label htmlFor="ct-message" className="sr-only">{t("contact.messageLabel")}</label>
                <textarea id="ct-message" name="message" required placeholder={t("contact.messageLabel")} rows={4}
                  className="w-full bg-transparent border-b border-neutral-300 focus:border-black outline-none py-3 placeholder:text-neutral-500 resize-y" />
              </div>
              <button type="submit"
                className="w-full bg-[#171a21] text-white py-5 text-sm tracking-[0.25em] font-heading hover:bg-black transition">
                {t("contact.sendButton")}
              </button>
            </form>
          )}

          <button
            aria-label={t("footer.backToTop")}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="absolute right-5 top-1/2 w-11 h-11 rounded-full border border-neutral-400 bg-white/70 grid place-items-center hover:bg-white"
          >
            ↑
          </button>
        </div>
      </section>

      {/* ===== Tra cứu tin nhắn đã gửi + xem trả lời của shop ===== */}
      <ContactChatLookup />
    </div>
  );
}
