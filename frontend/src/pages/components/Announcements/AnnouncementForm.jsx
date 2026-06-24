export default function AnnouncementForm({
    announcementImage,
    editingId,
    isCreating,
    isEditing,
    isVisible,
    newAnnouncement,
    onCancel,
    onSubmit,
    setAnnouncementImage,
    setNewAnnouncement,
}) {
    if (!isVisible) return null;

    return (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
                {editingId ? 'Edit Announcement' : 'Create New Announcement'}
            </h2>
            <form onSubmit={onSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">Title</label>
                    <input
                        type="text"
                        value={newAnnouncement.title}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                        placeholder="Enter announcement title"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none transition"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">Content</label>
                    <textarea
                        value={newAnnouncement.content}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                        placeholder="Enter announcement content"
                        rows={4}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none transition resize-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">Target</label>
                    <select
                        value={newAnnouncement.target}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, target: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none transition"
                    >
                        <option value="all">All Members</option>
                        <option value="bod">BOD</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">Image (Optional)</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setAnnouncementImage(e.target.files?.[0] || null)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none transition"
                    />
                    {announcementImage && (
                        <p className="mt-2 text-xs text-slate-600">Selected: {announcementImage.name}</p>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={!newAnnouncement.title.trim() || !newAnnouncement.content.trim() || isCreating || isEditing}
                        className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                        {editingId
                            ? isEditing ? 'Saving...' : 'Save Changes'
                            : isCreating ? 'Posting...' : 'Post Announcement'}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 rounded-lg bg-slate-200 text-slate-900 font-semibold hover:bg-slate-300 transition"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
