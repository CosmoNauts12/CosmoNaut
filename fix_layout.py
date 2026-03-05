import re

with open('app/components/WorkspaceHeader.tsx', 'r') as f:
    content = f.read()

# The section to replace starts from: <div className="flex items-center gap-4">
# and ends right before: <InviteModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} />

target = """      <div className="flex items-center gap-4">
        {/* User Dropdown */}
        <div className="relative flex items-center h-full">"""

# Wait, the best way is to locate the index of start and end.
start_str = '      <div className="flex items-center gap-4">'
end_str = '      <InviteModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} />'

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx == -1 or end_idx == -1:
    print("Could not find start or end index.")
    exit(1)

# Extract original section to parse out pieces
original = content[start_idx:end_idx]

# We know the pieces
facepile_start = original.find('{/* Collaborators Facepile */}')
divider1_start = original.find('{/* Divider before Invite */}')
invite_start = original.find('<button id="tour-invite-btn"')
divider2_start = original.find('<div className="h-4 w-px bg-card-border mx-1" />', invite_start)
theme_toggle_start = original.find('<ThemeToggle />')
user_drop_start = original.find('{/* User Dropdown */}')
notifications_start = original.find('{/* Updates / Notifications Bell */}')

# facepile block ends at divider1_start
facepile_block = original[facepile_start:divider1_start].rstrip()

# user dropout block ends at notifications_start
user_drop_block = original[user_drop_start:notifications_start].rstrip()

# notifications block ends at facepile_start
notifications_block = original[notifications_start:facepile_start].rstrip()

# copy exactly the invite button
invite_end = original.find('\n', original.find('Invite\n        </button>'))
invite_block = original[original.rfind('        <button id="tour-invite-btn"', 0, invite_end):invite_end + 9].rstrip()
if not invite_block.strip():
    invite_block = """        {/* Primary action: Invite button */}
        <button id="tour-invite-btn" onClick={() => setIsInviteOpen(true)} className="px-3 py-1.5 glass-btn-primary rounded-xl text-[11px] flex items-center gap-1.5 active:scale-95 shadow-lg shadow-primary/20">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
          Invite
        </button>"""

divider = '        <div className="h-4 w-px bg-card-border" />'

# Now assemble new structure
new_structure = f"""      {{/* Center Section */}}
      <div className="flex-1 flex justify-center">
        {{/* Empty area for future elements like search or page title */}}
      </div>

      {{/* Right Section (User Actions) */}}
      <div className="flex items-center gap-4">
{facepile_block.replace(" ml-2 ", " ")}

{invite_block}

{divider}

        {{/* System Controls */}}
        <div className="flex items-center gap-2">
{notifications_block.replace("        {/* Updates", "          {/* Updates").replace("        <button", "          <button").replace("          onClick", "            onClick").replace("          className=", "            className=").replace("          title=", "            title=").replace("        >", "          >").replace("          <svg ", "            <svg ").replace("            <path", "              <path").replace("          </svg>", "            </svg>").replace("          {pending", "            {pending").replace("            <span", "              <span").replace("              {pending", "                {pending").replace("            </span>", "              </span>").replace("          )}", "            )}").replace("        </button>", "          </button>")}

          <ThemeToggle />
        </div>

{divider}

{user_drop_block}
      </div>
"""

# replace in content
new_content = content[:start_idx] + new_structure + "\n" + content[end_idx:]

with open('app/components/WorkspaceHeader.tsx', 'w') as f:
    f.write(new_content)

print("done")
