using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace Comssire.Auth;

public class PermissionPolicyProvider : DefaultAuthorizationPolicyProvider
{
    public PermissionPolicyProvider(IOptions<AuthorizationOptions> options) : base(options) { }

    public override async Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
    {
        // ✅ Si existe una policy registrada normal, úsala
        var existing = await base.GetPolicyAsync(policyName);
        if (existing != null) return existing;

        // ✅ Si no existe, creamos policy dinámica por permiso
        var policy = new AuthorizationPolicyBuilder()
            .AddRequirements(new PermissionRequirement(policyName))
            .Build();

        return policy;
    }
}