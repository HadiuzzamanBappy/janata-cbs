"use client";

import * as React from "react";
import { Loader2, Search, Check, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ResetPassword({ command: _command }: { command?: string }) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const [idText, setIdText] = React.useState("");
  const [bankId, setBankId] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [showForm, setShowForm] = React.useState(false);
  const [isLocked, setIsLocked] = React.useState(false);

  const fetchUser = async () => {
    if (!idText) {
      setError("An ID is required to get record details.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    setShowForm(false);
    
    try {
      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          servicePath: "default",
          requestType: "GET",
          controlName: "USER.PASS.RESET",
          recordFunction: "S",
          recordId: idText,
        }),
      });

      const res = await response.json();
      if (response.ok && res.statusCode === 200) {
        const modelData = res.responseData;
        if (modelData) {
          setBankId(modelData.bankId || "");
          setFullName(modelData.fullName || "");
          setShowForm(true);
          setIsLocked(true);
        }
      } else if (res.statusCode === 404) {
         setError(res.message || "Record not found.");
      } else {
        setError(res.errors ? res.errors.join(", ") : "Failed to fetch record.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!idText || !fullName || !bankId) {
      setError("Please load a valid user record first.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          servicePath: "default",
          requestType: "PUT",
          controlName: "USER.PASS.RESET",
          recordFunction: "I",
          recordId: idText,
          authLevel: 1,
          data: {
            bankId,
            fullName
          },
        }),
      });

      const res = await response.json();
      if (response.ok && (res.statusCode === 200 || res.statusCode === 201)) {
        setSuccess(res.message || "Password successfully reset for user.");
        setShowForm(false);
        setIdText("");
        setIsLocked(false);
      } else {
        setError(res.errors ? res.errors.join(", ") : res.message || "Failed to reset password.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = async () => {
     if (!idText) {
      setError("An ID is required to authorize record.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          servicePath: "default",
          requestType: "UPR",
          controlName: "?",
          recordFunction: "A",
          recordId: idText,
          data: {},
        }),
      });

      const res = await response.json();
      if (response.ok && (res.statusCode === 200 || res.statusCode === 201)) {
        setSuccess(res.message || "Record authorized successfully.");
        setShowForm(false);
        setIdText("");
        setIsLocked(false);
      } else {
        setError(res.errors ? res.errors.join(", ") : res.message || "Failed to authorize record.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Action Bar */}
      <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="flex gap-2">
           <Button variant="outline" size="sm" onClick={handleReset} disabled={!showForm || loading}>
            <Save className="w-4 h-4 mr-2 text-blue-500" /> Save/Reset
          </Button>
          <Button variant="outline" size="sm" onClick={handleAuthorize} disabled={loading || !idText}>
            <Check className="w-4 h-4 mr-2 text-green-500" /> Authorize
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-gray-700 dark:text-gray-300 mr-2">USER.PASS.RESET</span>
          <div className="flex relative">
            <Input 
              className="w-64 h-8 text-sm pr-8" 
              placeholder="Enter User ID" 
              value={idText}
              onChange={(e) => setIdText(e.target.value.toUpperCase())}
              disabled={isLocked || loading}
              onKeyDown={(e) => e.key === 'Enter' && fetchUser()}
            />
            <Button size="sm" variant="ghost" className="absolute right-0 h-8 w-8 p-0" onClick={fetchUser} disabled={loading || isLocked}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>
          {isLocked && (
             <Button size="sm" variant="ghost" onClick={() => { setIsLocked(false); setShowForm(false); setIdText(""); setError(null); setSuccess(null); }} className="h-8 text-xs">Clear</Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 flex-1 overflow-auto">
        {error && (
          <Alert variant="destructive" className="mb-6 max-w-2xl mx-auto">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 max-w-2xl mx-auto border-green-500 text-green-700 bg-green-50 dark:bg-green-950 dark:text-green-400">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {showForm && (
          <div className="max-w-2xl mx-auto mt-4 bg-white border border-gray-200 dark:border-gray-800 dark:bg-gray-950 rounded-lg shadow-sm p-6 space-y-6">
            <div className="border-b pb-4 border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-semibold">User Details</h3>
              <p className="text-sm text-fg-muted">Review details before executing a password reset.</p>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium">Bank ID <span className="text-red-500">*</span></Label>
              <div className="col-span-3">
                <Input value={bankId} disabled className="bg-gray-50 dark:bg-gray-900 w-32" />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium">Full Name <span className="text-red-500">*</span></Label>
              <div className="col-span-3">
                <Input value={fullName} disabled className="bg-gray-50 dark:bg-gray-900" />
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400">
              <p>Click <strong className="text-blue-500">Save/Reset</strong> in the toolbar to initiate the administrative password reset for this user.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
