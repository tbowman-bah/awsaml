cask "awsaml" do
  version "3.1.1"
  sha256 "9cb1aaf09cc99882fc8571e761dd010ed7474bb5175ccf772d77c2321eb78039"

  url "https://github.com/rapid7/awsaml/releases/download/v#{version}/Awsaml-darwin-universal-#{version}.zip"
  name "awsaml"
  desc "Awsaml is an application for providing automatically rotated temporary AWS credentials."
  homepage "https://github.com/rapid7/awsaml"

  livecheck do
    url :url
    strategy :github_latest
  end

  app "Awsaml.app"
end
