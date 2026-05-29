import 'package:flutter/material.dart';
import '../../../core/theme.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key, required this.rideId});
  final String rideId;
  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _ctrl = TextEditingController();
  final _scroll = ScrollController();
  final _messages = <_Message>[];

  final _quickReplies = ['I\'m at the pickup', 'On my way', 'Please wait', 'I can see you', 'I\'ll be there in 2 min'];

  @override
  void dispose() { _ctrl.dispose(); _scroll.dispose(); super.dispose(); }

  void _send([String? text]) {
    final msg = text ?? _ctrl.text.trim();
    if (msg.isEmpty) return;
    setState(() => _messages.add(_Message(text: msg, isMine: true, time: DateTime.now())));
    _ctrl.clear();
    Future.delayed(const Duration(milliseconds: 100), () => _scroll.animateTo(_scroll.position.maxScrollExtent, duration: const Duration(milliseconds: 300), curve: Curves.easeOut));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Row(children: [
          CircleAvatar(radius: 18, backgroundColor: kGold, child: Icon(Icons.person, color: kCharcoal, size: 20)),
          SizedBox(width: 10),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Your Rider', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
            Text('Active ride', style: TextStyle(fontSize: 11, color: kSuccess)),
          ]),
        ]),
        actions: [
          IconButton(icon: const Icon(Icons.call_outlined, color: kGold), onPressed: () {}),
        ],
      ),
      body: Column(
        children: [
          // Messages
          Expanded(
            child: _messages.isEmpty
              ? const Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Icon(Icons.chat_bubble_outline, color: kSubtext, size: 48),
                  SizedBox(height: 12),
                  Text('Send a message to your rider', style: TextStyle(color: kSubtext)),
                ]))
              : ListView.builder(
                  controller: _scroll,
                  padding: const EdgeInsets.all(16),
                  itemCount: _messages.length,
                  itemBuilder: (_, i) => _MessageBubble(msg: _messages[i]),
                ),
          ),

          // Quick replies
          SizedBox(
            height: 46,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              itemCount: _quickReplies.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (_, i) => GestureDetector(
                onTap: () => _send(_quickReplies[i]),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  decoration: BoxDecoration(
                    color: kGold.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: kGold.withOpacity(0.4)),
                  ),
                  child: Text(_quickReplies[i], style: const TextStyle(color: kGold, fontSize: 12)),
                ),
              ),
            ),
          ),

          // Input
          Container(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 16),
            decoration: BoxDecoration(color: kCharcoalDark, border: Border(top: BorderSide(color: kBorder.withOpacity(0.4)))),
            child: SafeArea(
              child: Row(children: [
                Expanded(
                  child: TextField(
                    controller: _ctrl,
                    decoration: const InputDecoration(hintText: 'Type a message...', contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 10)),
                    onSubmitted: (_) => _send(),
                  ),
                ),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: () => _send(),
                  child: Container(
                    width: 44, height: 44,
                    decoration: const BoxDecoration(color: kGold, shape: BoxShape.circle),
                    child: const Icon(Icons.send_rounded, color: kCharcoal, size: 20),
                  ),
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

class _Message {
  const _Message({required this.text, required this.isMine, required this.time});
  final String text;
  final bool isMine;
  final DateTime time;
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({required this.msg});
  final _Message msg;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: msg.isMine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.72),
        decoration: BoxDecoration(
          color: msg.isMine ? kGold.withOpacity(0.85) : kCharcoalLight,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(msg.isMine ? 16 : 4),
            bottomRight: Radius.circular(msg.isMine ? 4 : 16),
          ),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text(msg.text, style: TextStyle(color: msg.isMine ? kCharcoal : kCream, fontSize: 14)),
          const SizedBox(height: 4),
          Text('${msg.time.hour}:${msg.time.minute.toString().padLeft(2, '0')}', style: TextStyle(color: msg.isMine ? kCharcoal.withOpacity(0.6) : kSubtext, fontSize: 10)),
        ]),
      ),
    );
  }
}
