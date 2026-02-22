import re

with open("app/components/CollectionsProvider.tsx", "r") as f:
    code = f.read()

# 1
code = code.replace(
    "const { user } = useAuth();", 
    "const { user, isDemo } = useAuth();"
)

# 2
code = code.replace(
    """  // Load Workspaces on Login (Real-time Firestore Sync)
  useEffect(() => {
    if (!user) {
      setWorkspaces([]);
      setActiveWorkspaceId("default");
      return;
    }

    setLoading(true);""",
    """  // Load Workspaces on Login (Real-time Firestore Sync)
  useEffect(() => {
    if (!user) {
      setWorkspaces([]);
      setActiveWorkspaceId("default");
      return;
    }

    if (isDemo) {
      setWorkspaces([{
        id: "demo-workspace",
        name: "Demo Workspace",
        ownerId: "demo-user",
        isOwner: true
      } as any]);
      setActiveWorkspaceId("demo-workspace");
      setLoading(false);
      return;
    }

    setLoading(true);"""
)

# 3
code = code.replace(
    "  }, [user]);",
    "  }, [user, isDemo]);"
)

# 4
code = code.replace(
    """  // Load Collections when Workspace changes (Real-time Firestore Sync)
  useEffect(() => {
    if (!user || !activeWorkspaceId || activeWorkspaceId === "default") {
      setCollections([]);
      return;
    }

    setLoading(true);""",
    """  // Load Collections when Workspace changes (Real-time Firestore Sync)
  useEffect(() => {
    if (!user || !activeWorkspaceId || activeWorkspaceId === "default") {
      setCollections([]);
      return;
    }

    if (isDemo) {
      setCollections([]);
      setHistory([]);
      setLoading(false);
      return;
    }

    setLoading(true);"""
)

# 5
code = code.replace(
    "  }, [user, activeWorkspaceId, updateSettings, settings.lastWorkspaceId]);",
    "  }, [user, isDemo, activeWorkspaceId, updateSettings, settings.lastWorkspaceId]);"
)

# 6
code = code.replace(
    """  const createWorkspace = async (name: string) => {
    if (!user) return "";
    const id = `w_${Date.now()}`;

    try {""",
    """  const createWorkspace = async (name: string) => {
    if (!user) return "";
    const id = `w_${Date.now()}`;

    if (isDemo) {
      setWorkspaces(prev => [...prev, { id, name, ownerId: "demo-user", isOwner: true } as any]);
      setActiveWorkspaceId(id);
      return id;
    }

    try {"""
)


# 7
code = code.replace(
    """  const deleteWorkspace = async (id: string) => {
    if (currentRole === "read") return;
    try {""",
    """  const deleteWorkspace = async (id: string) => {
    if (currentRole === "read") return;

    if (isDemo) {
      const remaining = workspaces.filter(w => w.id !== id);
      setWorkspaces(remaining);
      if (activeWorkspaceId === id) {
        setActiveWorkspaceId(remaining[0]?.id || "default");
      }
      return;
    }

    try {"""
)

# 8
code = code.replace(
    """  const renameWorkspace = async (id: string, name: string) => {
    if (currentRole === "read") return;
    try {""",
    """  const renameWorkspace = async (id: string, name: string) => {
    if (currentRole === "read") return;

    if (isDemo) {
      setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, name } as any : w));
      return;
    }

    try {"""
)

# 9
code = code.replace(
    """  const createCollection = async (name: string) => {
    if (!activeWorkspaceId || activeWorkspaceId === "default" || currentRole === "read") return "";
    const id = `c_${Date.now()}`;

    try {""",
    """  const createCollection = async (name: string) => {
    if (!activeWorkspaceId || activeWorkspaceId === "default" || currentRole === "read") return "";
    const id = `c_${Date.now()}`;

    if (isDemo) {
      setCollections(prev => [...prev, { name, requests: [], id, createdAt: new Date() as any }]);
      return id;
    }

    try {"""
)

# 10
code = code.replace(
    """  const saveRequest = async (requestData: Omit<SavedRequest, 'id'>, collectionId: string) => {
    if (!activeWorkspaceId || activeWorkspaceId === "default" || currentRole === "read") return;
    const id = `r_${Date.now()}`;
    const newRequest = { ...requestData, id };

    const targetCollection = collections.find(c => c.id === collectionId);
    if (!targetCollection) return;

    try {""",
    """  const saveRequest = async (requestData: Omit<SavedRequest, 'id'>, collectionId: string) => {
    if (!activeWorkspaceId || activeWorkspaceId === "default" || currentRole === "read") return;
    const id = `r_${Date.now()}`;
    const newRequest = { ...requestData, id };

    if (isDemo) {
      setCollections(prev => prev.map(c => 
        c.id === collectionId ? { ...c, requests: [...c.requests, newRequest] } : c
      ));
      return;
    }

    const targetCollection = collections.find(c => c.id === collectionId);
    if (!targetCollection) return;

    try {"""
)

# 11
code = code.replace(
    """  const updateRequest = async (request: SavedRequest, collectionId: string) => {
    if (!activeWorkspaceId || activeWorkspaceId === "default" || currentRole === "read") return;
    const targetCollection = collections.find(c => c.id === collectionId);
    if (!targetCollection) return;

    const newRequests = targetCollection.requests.map(r => r.id === request.id ? request : r);
    try {""",
    """  const updateRequest = async (request: SavedRequest, collectionId: string) => {
    if (!activeWorkspaceId || activeWorkspaceId === "default" || currentRole === "read") return;

    if (isDemo) {
      setCollections(prev => prev.map(c => 
        c.id === collectionId ? { ...c, requests: c.requests.map(r => r.id === request.id ? request : r) } : c
      ));
      return;
    }

    const targetCollection = collections.find(c => c.id === collectionId);
    if (!targetCollection) return;

    const newRequests = targetCollection.requests.map(r => r.id === request.id ? request : r);
    try {"""
)

# 12
code = code.replace(
    """  const deleteRequest = async (requestId: string, collectionId: string) => {
    if (!activeWorkspaceId || activeWorkspaceId === "default" || currentRole === "read") return;
    const targetCollection = collections.find(c => c.id === collectionId);
    if (!targetCollection) return;

    const newRequests = targetCollection.requests.filter(r => r.id !== requestId);
    try {""",
    """  const deleteRequest = async (requestId: string, collectionId: string) => {
    if (!activeWorkspaceId || activeWorkspaceId === "default" || currentRole === "read") return;

    if (isDemo) {
      setCollections(prev => prev.map(c => 
        c.id === collectionId ? { ...c, requests: c.requests.filter(r => r.id !== requestId) } : c
      ));
      return;
    }

    const targetCollection = collections.find(c => c.id === collectionId);
    if (!targetCollection) return;

    const newRequests = targetCollection.requests.filter(r => r.id !== requestId);
    try {"""
)

# 13
code = code.replace(
    """  const renameRequest = async (requestId: string, collectionId: string, newName: string) => {
    if (!activeWorkspaceId || activeWorkspaceId === "default" || currentRole === "read") return;
    const targetCollection = collections.find(c => c.id === collectionId);
    if (!targetCollection) return;

    const newRequests = targetCollection.requests.map(r => r.id === requestId ? { ...r, name: newName } : r);
    try {""",
    """  const renameRequest = async (requestId: string, collectionId: string, newName: string) => {
    if (!activeWorkspaceId || activeWorkspaceId === "default" || currentRole === "read") return;

    if (isDemo) {
      setCollections(prev => prev.map(c => 
        c.id === collectionId ? { ...c, requests: c.requests.map(r => r.id === requestId ? { ...r, name: newName } : r) } : c
      ));
      return;
    }

    const targetCollection = collections.find(c => c.id === collectionId);
    if (!targetCollection) return;

    const newRequests = targetCollection.requests.map(r => r.id === requestId ? { ...r, name: newName } : r);
    try {"""
)

# 14
code = code.replace(
    """  const deleteCollection = async (collectionId: string) => {
    if (!activeWorkspaceId || activeWorkspaceId === "default" || currentRole === "read") return;
    try {""",
    """  const deleteCollection = async (collectionId: string) => {
    if (!activeWorkspaceId || activeWorkspaceId === "default" || currentRole === "read") return;

    if (isDemo) {
      setCollections(prev => prev.filter(c => c.id !== collectionId));
      return;
    }

    try {"""
)


# 15
code = code.replace(
    """  const renameCollection = async (collectionId: string, newName: string) => {
    if (!activeWorkspaceId || activeWorkspaceId === "default" || currentRole === "read") return;
    try {""",
    """  const renameCollection = async (collectionId: string, newName: string) => {
    if (!activeWorkspaceId || activeWorkspaceId === "default" || currentRole === "read") return;

    if (isDemo) {
      setCollections(prev => prev.map(c => c.id === collectionId ? { ...c, name: newName } : c));
      return;
    }

    try {"""
)

# 16
code = code.replace(
    """    // Firestore does not support undefined values
    if (newItem.error === undefined) {
      delete newItem.error;
    }

    try {""",
    """    // Firestore does not support undefined values
    if (newItem.error === undefined) {
      delete newItem.error;
    }

    if (isDemo) {
      setHistory(prev => [newItem, ...prev].slice(0, 50));
      return;
    }

    try {"""
)


# 17
code = code.replace(
    """  const clearHistory = async () => {
    if (!activeWorkspaceId || activeWorkspaceId === "default" || currentRole === "read") return;
    try {""",
    """  const clearHistory = async () => {
    if (!activeWorkspaceId || activeWorkspaceId === "default" || currentRole === "read") return;

    if (isDemo) {
      setHistory([]);
      return;
    }

    try {"""
)

with open("app/components/CollectionsProvider.tsx", "w") as f:
    f.write(code)

print("Done")
