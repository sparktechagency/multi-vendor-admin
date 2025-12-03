import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { AiOutlineSearch } from "react-icons/ai";
import { RiSendPlane2Fill } from "react-icons/ri";
import { FiMenu, FiMoreVertical } from "react-icons/fi";
import { IoImagesOutline } from "react-icons/io5";
import { BsCheck2All } from "react-icons/bs";
import { useSocket } from "../../context/SocketContext";
import { useGetChatQuery, useGetMessageOfChatQuery, useSendMessageMutation, useStartChatMutation } from "../../Redux/api/Chat/chatApis";
import Loader from "../../components/common/Loader";
import { convertDate } from "../../utils/convertDate";
import { useSelector } from "react-redux";
import { X } from "lucide-react";

const Chat = () => {
  const location = useLocation();
  const {
    socket,
    sendMessage,
    isConnected,
    subscribeToMessages,
    unsubscribeFromMessages,
    subscribeToConversationUpdates,
    unsubscribeFromConversationUpdates,
    startTyping,
    stopTyping,
  } = useSocket();

  const { data: chat, isLoading, refetch: refetchChats } = useGetChatQuery();
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const { user } = useSelector((state) => state.auth);
  const [sendMessageMutation] = useSendMessageMutation();

  const [startChat] = useStartChatMutation();

  const {
    data: messagesData,
    isLoading: messagesLoading,
    refetch: refetchMessages
  } = useGetMessageOfChatQuery(selectedChat?._id, {
    skip: !selectedChat?._id,
    refetchOnMountOrArgChange: true
  });

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [file, setFile] = useState([]);

  const [tempMessageId, setTempMessageId] = useState(null);

  useEffect(() => {
    if (chat?.data?.[0] && !selectedChat) {
      handleSelectChat(chat.data[0]);
    }
  }, [chat]);

  useEffect(() => {
    if (messagesData) {
      setMessages(messagesData);
    }
  }, [messagesData]);

  useEffect(() => {
    const handleNewMessage = (message) => {

      if (message.chat === selectedChat?._id) {
        setMessages(prev => {
          if (prev.some(m => m._id === message._id)) return prev;
          const filtered = prev.filter(msg => !msg._id.includes('temp-'));
          return [...filtered, message];
        });

        setTempMessageId(null);

        refetchChats();
      }
    };

    const handleConversationUpdate = (data) => {
      refetchChats();
    };

    const messageHandlerId = subscribeToMessages(handleNewMessage);
    const conversationHandlerId = subscribeToConversationUpdates(handleConversationUpdate);

    return () => {
      unsubscribeFromMessages(messageHandlerId);
      unsubscribeFromConversationUpdates(conversationHandlerId);
    };
  }, [selectedChat, subscribeToMessages, unsubscribeFromMessages, subscribeToConversationUpdates, unsubscribeFromConversationUpdates, refetchChats]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSelectChat = (chatItem) => {
    setSelectedChat(chatItem);
    setSelectedUser(chatItem.receiverId);
    setShowSidebar(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !isConnected) return;

    const tempId = `temp-${Date.now()}`;
    setTempMessageId(tempId);
    const tempMessage = {
      _id: tempId,
      content: newMessage.trim(),
      sender: { _id: user?.id, name: user?.name || "You" },
      seenBy: [user?.id],
      createdAt: new Date().toISOString(),
      status: 'sending',
      chat: selectedChat?._id,
      imageUrls: []
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      let imageUrls = [];

      if (file.length > 0) {
        const formData = new FormData();
        formData.append("chatId", selectedChat?._id);
        formData.append("content", newMessage.trim());
        file.forEach(f => formData.append("image", f));
        const res = await sendMessageMutation(formData).unwrap();
        imageUrls = res?.data?.imageUrls || [];
      } else {
        const messageData = {
          chatId: selectedChat?._id,
          content: newMessage.trim(),
        };
        sendMessage(messageData);
      }

      setNewMessage("");
      setFile([]);
      refetchMessages();
      stopTyping({ chatId: selectedChat?._id, receiverId: selectedUser?._id });
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => prev.filter(msg => msg._id !== tempMessageId));
      setTempMessageId(null);
    }
  };

  const handleTyping = useCallback(() => {
    if (!selectedChat || !isConnected) return;

    startTyping({
      chatId: selectedChat?._id,
      receiverId: selectedUser?._id
    });

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    const timeout = setTimeout(() => {
      stopTyping({
        chatId: selectedChat?._id,
        receiverId: selectedUser?._id
      });
      setTypingTimeout(null);
    }, 2000);

    setTypingTimeout(timeout);
  }, [selectedChat, isConnected, startTyping, stopTyping, typingTimeout, selectedUser]);

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    handleTyping();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (e) => {
    const selected = Array.from(e.target.files || []);
    const total = file.length + selected.length;
    if (total > 5) {
      throw new Error("Cannot upload more than 5 files");
    }
    if (selected.length > 0) {
      setFile(prev => [...prev, ...selected]);
    }
  };

  const handleStartChat = async (participantId) => {
    try {
      if (!participantId) throw new Error("Participant ID is required");

      const res = await startChat({ participantId }).unwrap();

      if (res?.success && res.data) {
         handleSelectChat(res.data);
        }
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  useEffect(() => {
    const participantId = location.state?.participantId;
    if (participantId) {
      handleStartChat(participantId);
      // Optional: Clear the state after using it, to avoid re-triggering on re-renders.
      // window.history.replaceState({}, document.title)
    }
  }, [location.state?.participantId]);

  const filteredChatsSource = chat?.data?.filter(chatItem =>
    chatItem.receiverId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Deduplicate the chats array based on _id to prevent rendering duplicates
  const filteredChats = Array.from(new Map(filteredChatsSource.map(item => [item._id, item])).values());

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-gradient-to-br from-gray-50 to-gray-100">

      <div className="px-5 py-3 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">Messages</h1>
          <div className="md:hidden">
            <FiMenu
              className="text-2xl text-gray-600 cursor-pointer"
              onClick={() => setShowSidebar(!showSidebar)}
            />
          </div>
        </div>
        {!isConnected && (
          <div className="mt-1 text-xs text-red-500">
            Disconnected - attempting to reconnect...
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">

        <div
          className={`absolute md:relative top-0 left-0 w-80 md:w-96 h-full bg-white shadow-lg md:shadow-none md:border-r border-gray-200 flex flex-col transition-all duration-300 z-50 ${showSidebar ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            }`}
        >

          <div className="flex justify-end p-4 border-b md:hidden">
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setShowSidebar(false)}
            >
              ✖
            </button>
          </div>


          <div className="p-5 border-b border-gray-100">
            <div className="relative">
              <AiOutlineSearch className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14803c] focus:border-transparent transition-all"
              />
            </div>
          </div>


          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <Loader />
            ) : filteredChats.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No conversations found
              </div>
            ) : (
              filteredChats.map((item) => (
                <div
                  key={item?._id}
                  className={`flex items-center gap-3 p-4 cursor-pointer border-b border-gray-50 hover:bg-gray-50 transition-colors 
                    ${selectedChat?._id === item?._id
                      ? "bg-[#0B704E]/10 border-r-4 border-r-[#0B704E]"
                      : ""
                    }`}
                  onClick={() => handleStartChat(item?.receiverId?._id)}
                >
                  <div className="relative">
                    <img
                      src={item?.receiverId?.image || "https://avatar.iran.liara.run/public/13"}
                      alt={item?.receiverId?.name}
                      className="object-cover w-12 h-12 rounded-full"
                    />
                    {item?.receiverId?.online && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#14803c] border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-[#111827] truncate">
                        {item?.receiverId?.name}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {convertDate(item?.lastMessage?.createdAt || item?.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 truncate">
                      {item?.lastMessage?.content || "No messages yet"}
                    </p>
                  </div>
                  {item?.unread > 0 && (
                    <div className="bg-[#0B704E] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {item?.unread}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>


        <div className="flex flex-col flex-1 bg-white">
          {selectedChat ? (
            <>
              <div className="bg-[#0B704E] text-white p-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={selectedUser?.image || "https://avatar.iran.liara.run/public/13"}
                      alt={selectedUser?.name}
                      className="object-cover w-12 h-12 border-2 rounded-full border-white/20"
                    />
                    {selectedUser?.online && (
                      <div className="absolute w-4 h-4 bg-green-400 border-2 border-white rounded-full -bottom-1 -right-1"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold">{selectedUser?.name}</h2>
                    <p className="text-sm text-[#E6F6EC]">
                      {selectedUser?.online ? "Online" : "Offline"}
                    </p>
                  </div>
                  <button className="p-2 transition-colors rounded-full hover:bg-white/10">
                    <FiMoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>


              <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-gray-50">
                {messagesLoading ? (
                  <Loader />
                ) : messages.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    No messages yet. Start a conversation!
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg?._id}
                      className={`flex ${msg?.sender?._id === user?.id
                        ? "justify-end"
                        : "justify-start"
                        }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${msg?.sender?._id === user?.id
                          ? "bg-[#14803c] text-white rounded-br-md"
                          : "bg-white text-[#111827] border rounded-bl-md"
                          } ${msg.status === 'sending' ? 'opacity-70' : ''}`}
                      >
                        {msg?.imageUrls?.length > 0 && (
                          <div className={`w-full p-1 grid grid-cols-${msg?.imageUrls?.length}`}>
                            {msg?.imageUrls?.map((url, index) => (
                              <img
                                key={index}
                                src={url}
                                alt="message"
                                className="object-contain w-full h-full aspect-square rounded-2xl"
                              />
                            ))}
                          </div>
                        )}
                        <p className="text-sm leading-relaxed">{msg?.content}</p>
                        <div className="flex items-center justify-between gap-2 mt-2">
                          <span
                            className={`text-xs ${msg?.sender?._id === user?.id
                              ? "text-[#E6F6EC]"
                              : "text-gray-500"
                              }`}
                          >
                            {convertDate(msg?.createdAt)}
                          </span>
                          {msg?.sender?._id === user?.id && (
                            <div className="flex items-center">
                              {msg.status === 'sending' && (
                                <div className="w-3 h-3 border-2 border-[#E6F6EC] border-t-transparent rounded-full animate-spin"></div>
                              )}
                              {msg.status !== 'sending' && msg?.seenBy?.length > 1 && (
                                <BsCheck2All className="w-3 h-3 text-white" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}


                {isTyping && (
                  <div className="flex justify-start">
                    <div className="px-4 py-3 bg-white border shadow-sm rounded-2xl rounded-bl-md">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>


              <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex items-end gap-3">
                  <div className="relative flex-1">
                    {file.length > 0 && <div className="absolute bottom-0 grid h-48 max-w-xl grid-cols-5 gap-1 p-2 overflow-hidden rounded-lg -top-56">
                      {file.map((f, index) => (
                        <div key={index} className="relative col-span-1 rounded-md bg-slate-200">
                          <img
                            src={URL.createObjectURL(f)}
                            alt="file"
                            className="object-contain w-full h-full"
                          />
                          <X className="absolute cursor-pointer top-2 right-2" onClick={() => {
                            setFile(prev => prev.filter((_, i) => i !== index));
                          }} />
                        </div>
                      ))}
                    </div>}
                    <textarea
                      value={newMessage}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#14803c] focus:border-transparent resize-none max-h-32"
                      rows="1"
                    />
                  </div>

                  <div className="relative flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      accept="image/*,application/pdf,.doc,.docx"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 text-gray-500 hover:text-[#14803c] hover:bg-[#0B704E]/10 rounded-full transition-colors"
                    >
                      <IoImagesOutline className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || !isConnected}
                      className={`p-3 rounded-full transition-all ${newMessage.trim() && isConnected
                        ? "bg-[#14803c] hover:bg-[#0B704E] text-white shadow-lg"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                    >
                      <RiSendPlane2Fill className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center flex-1 bg-gray-50">
              <div className="text-center text-gray-500">
                <div className="mb-4 text-6xl">💬</div>
                <h3 className="mb-2 text-xl font-semibold">No Chat Selected</h3>
                <p>Select a conversation from the sidebar to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;