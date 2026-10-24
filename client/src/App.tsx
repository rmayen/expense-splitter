import { Shell } from "./components/Shell";
import { Dashboard } from "./pages/Dashboard";
import { GroupDetail } from "./pages/GroupDetail";
import { Landing } from "./pages/Landing";
import { NewGroup } from "./pages/NewGroup";
import { go, useHashPath } from "./lib/route";

export function App() {
  const path = useHashPath();

  if (path === "/") return <Landing />;

  if (path === "/app") return <Shell path={path}><Dashboard /></Shell>;
  if (path === "/app/new") return <Shell path={path}><NewGroup /></Shell>;

  const group = path.match(/^\/app\/groups\/(\d+)$/);
  if (group) return <Shell path="/app/groups"><GroupDetail key={group[1]} groupId={Number(group[1])} /></Shell>;

  // Unknown paths go back to the dashboard rather than showing a blank page.
  go("/app");
  return null;
}
