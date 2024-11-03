import React from "react";

const DetectorInspector: React.FC = () => {
  const [url, setUrl] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  /**
   * validate if url is a valid wikipedia url
   * @param url - url string to validate
   * @return true if url is wikipedia url, otherwise false
   */
  const validateUrl = (url: string): boolean => {
    try {
      // convert to a url object to validate url format
      const urlObj = new URL(url);
      // check if the hostname ends with wikipedia.org
      if (urlObj.hostname.endsWith("wikipedia.org")) {
        setError("");
        return true;
      }
      setError("Please enter a valid Wikipedia URL");
      return false;
    } catch {
      // convert url throws error if url is invalid
      setError("Please enter a valid URL");
      return false;
    }
  };

  /**
   * handle change of input field
   * @param e - Input change event
   */
  const onChangeURL = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    // validate if input has value (prevent trigger validation for empty input)
    if (e.target.value) {
      validateUrl(e.target.value);
    }
  };

  const onScan = async () => {
    try {
      setLoading(true);
      setError("");
      // TODO: Create WikipediaInspector Service to generate graph
      // TODO: generate graph then save as image
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        value={url}
        onChange={onChangeURL}
        placeholder="Enter Wikipedia URL"
        type="url"
      />
      <button disabled={!!error || !url} onClick={onScan}>
        {loading ? "Loading" : "Scan"}
      </button>
      {error && <div style={{ color: "red" }}>{error}</div>}
    </div>
  );
};

export default DetectorInspector;
