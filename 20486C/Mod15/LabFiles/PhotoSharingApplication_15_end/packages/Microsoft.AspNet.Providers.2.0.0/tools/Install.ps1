param($installPath, $toolsPath, $package, $project)
try {
    # Set up variables
    $timestamp = (Get-Date).ToString('yyyyMMddHHmmss')
    $projectName = [IO.Path]::GetFileName($project.ProjectName.Trim([IO.PATH]::DirectorySeparatorChar, [IO.PATH]::AltDirectorySeparatorChar))
    $catalogName = "aspnet-$projectName-$timestamp"
    $connectionString ="Data Source=.\SQLEXPRESS;Initial Catalog=$catalogName;Integrated Security=SSPI"
    $connectionStringToken = "Data Source=.\SQLEXPRESS;Initial Catalog=aspnet-$projectName"
    $config = $project.ProjectItems | Where-Object { $_.Name -eq "Web.config" }    
    $configPath = ($config.Properties | Where-Object { $_.Name -eq "FullPath" }).Value
    
    # Load the Config File
    $xml = New-Object System.Xml.XmlDocument
    $xml.Load($configPath)
    
    function CommentNode($node) {
        if (!$node) {
            return;
        }
        
        $commentNode = $xml.CreateComment($node.OuterXml)
        $parent = $node.ParentNode
        $parent.InsertBefore($commentNode, $node) | Out-Null
        $parent.RemoveChild($node) | Out-Null
    }
    
    function GetConnectionStringToken($connectionStringValue, $tokenName) {
        $startIndex = $connectionStringValue.IndexOf($tokenName, [StringComparison]::OrdinalIgnoreCase)
        if ($startIndex -ge 0) {
            $endIndex = $connectionStringValue.IndexOf(';', $startIndex + 1)
            $endIndex = if ($endIndex -lt 0) { $connectionStringValue.Length } else { $endIndex }
            
            ';' + $connectionStringValue.Substring($startIndex, $endIndex - $startIndex)
        }
    }
    
    
    # Comment out older providers
    $node = $xml.SelectSingleNode("/configuration/system.web/membership/providers/add[@type='System.Web.Security.SqlMembershipProvider']")
    $addedNode = $xml.SelectSingleNode("/configuration/system.web/membership/providers/add[@name='DefaultMembershipProvider']")
    
    if ($node) {
        # Copy all attributes other than 'name', 'type' and 'connectionStringName' to the newly added node.
        $node.Attributes | Where { ! (@('name', 'type', 'connectionStringName') -contains $_.name) } | ForEach {
            $addedNode.SetAttribute($_.name, $_.value)
        }
    }
    
    $oldConnectionNode = $xml.SelectSingleNode("/configuration/connectionStrings/add[@name='$($node.connectionStringName)']")
    if ($oldConnectionNode) {
        $oldConnectionValue = $oldConnectionNode.connectionString
        # Copy AttachDBFileName and UserInstance values from the old connection string if they exist
        if ($oldConnectionValue.IndexOf('AttachDBFilename', [StringComparison]::OrdinalIgnoreCase) -ge 0) {
            $connectionString += ";AttachDBFilename=|DataDirectory|$catalogName.mdf"
        }
        $connectionString += (GetConnectionStringToken $oldConnectionValue 'User Instance')
    }
    
    CommentNode $node
    CommentNode $oldConnectionNode
    
    $node = $xml.SelectSingleNode("/configuration/system.web/profile/providers/add[@type='System.Web.Profile.SqlProfileProvider']")
    $oldConnectionNode = $xml.SelectSingleNode("/configuration/connectionStrings/add[@name='$($node.connectionStringName)']")
    CommentNode $node
    CommentNode $oldConnectionNode
    
    $node = $xml.SelectSingleNode("/configuration/system.web/roleManager/providers/add[@type='System.Web.Security.SqlRoleProvider']")
    $oldConnectionNode = $xml.SelectSingleNode("/configuration/connectionStrings/add[@name='$($node.connectionStringName)']")
    $connectionStringsToComment += $node.connectionStringName
    CommentNode $node
    CommentNode $oldConnectionNode
    
    # Change the Connection string
    $connectionStrings = $xml.SelectSingleNode("/configuration/connectionStrings")
    if (!$connectionStrings) {
        $connectionStrings = $xml.CreateElement("connectionStrings")
        $xml.configuration.AppendChild($connectionStrings) | Out-Null
    }
    
    if (!($connectionStrings.SelectNodes("add[@name='DefaultConnection']") | Where { $_.connectionString.StartsWith($connectionStringToken, 'OrdinalIgnoreCase') })) {
        # If there aren't any connection strings that look like ours, proceed to add one
        
        $newConnectionNode = $xml.CreateElement("add")
        $newConnectionNode.SetAttribute("name", "DefaultConnection")
        $newConnectionNode.SetAttribute("providerName", "System.Data.SqlClient")
        $newConnectionNode.SetAttribute("connectionString", $connectionString)
        
        $connectionStrings.AppendChild($newConnectionNode) | Out-Null
    }
    
    # Save the Config File 
    $xml.Save($configPath)
    
} catch {
    Write-Error "Unable to update the web.config file at $configPath. Add the following connection string to your config: <add name=`"DefaultConnection`" providerName=`"System.Data.SqlClient`" connectionString=`"$connectionString`" />"
}
# SIG # Begin signature block
# MIIdkwYJKoZIhvcNAQcCoIIdhDCCHYACAQExCzAJBgUrDgMCGgUAMGkGCisGAQQB
# gjcCAQSgWzBZMDQGCisGAQQBgjcCAR4wJgIDAQAABBAfzDtgWUsITrck0sYpfvNR
# AgEAAgEAAgEAAgEAAgEAMCEwCQYFKw4DAhoFAAQUCpq88PMv9wCMCrdSe8fxw4pV
# w5qgghhTMIIEwjCCA6qgAwIBAgITMwAAAMDeLD0HlORJeQAAAAAAwDANBgkqhkiG
# 9w0BAQUFADB3MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4G
# A1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSEw
# HwYDVQQDExhNaWNyb3NvZnQgVGltZS1TdGFtcCBQQ0EwHhcNMTYwOTA3MTc1ODUw
# WhcNMTgwOTA3MTc1ODUwWjCBsjELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hp
# bmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jw
# b3JhdGlvbjEMMAoGA1UECxMDQU9DMScwJQYDVQQLEx5uQ2lwaGVyIERTRSBFU046
# N0FCNS0yREYyLURBM0YxJTAjBgNVBAMTHE1pY3Jvc29mdCBUaW1lLVN0YW1wIFNl
# cnZpY2UwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDoiKVSfklVAB4E
# Oc9+r95kl32muXNITYcTbaRtuJl+MQzEnD0eU2JUXx2mI06ONnTfFW39ZQPF1pvU
# WkHBrS6m8oKy7Em4Ol91RJ5Knwy1VvY2Tawqh+VxwdARRgOeFtFm0S+Pa+BrXtVU
# hTtGl0BGMsKGEQKdDNGJD259Iq47qPLw3CmllE3/YFw1GGoJ9C3ry+I7ntxIjJYB
# LXA122vw93OOD/zWFh1SVq2AejPxcjKtHH2hjoeTKwkFeMNtIekrUSvhbuCGxW5r
# 54KW0Yus4o8392l9Vz8lSEn2j/TgPTqD6EZlzkpw54VSwede/vyqgZIrRbat0bAh
# b8doY8vDAgMBAAGjggEJMIIBBTAdBgNVHQ4EFgQUFf5K2jOJ0xmF1WRZxNxTQRBP
# tzUwHwYDVR0jBBgwFoAUIzT42VJGcArtQPt2+7MrsMM1sw8wVAYDVR0fBE0wSzBJ
# oEegRYZDaHR0cDovL2NybC5taWNyb3NvZnQuY29tL3BraS9jcmwvcHJvZHVjdHMv
# TWljcm9zb2Z0VGltZVN0YW1wUENBLmNybDBYBggrBgEFBQcBAQRMMEowSAYIKwYB
# BQUHMAKGPGh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2kvY2VydHMvTWljcm9z
# b2Z0VGltZVN0YW1wUENBLmNydDATBgNVHSUEDDAKBggrBgEFBQcDCDANBgkqhkiG
# 9w0BAQUFAAOCAQEAGeJAuzJMR+kovMi8RK/LtfrKazWlR5Lx02hM9GFmMk1zWCSc
# pfVY6xqfzWFllCFHBtOaJZqLiV97jfNCLpG0PULz24CWSkG7jJ+mZaCSicZ7ZC3b
# WDh1zpc54llYVyyTkRVYx/mtc9GujqbS8CBZgjaT/JsECnvGAPUcLYuSGt53CU1b
# UuiNwuzAhai4glcYyq3/7qMmmAtbnbCZhR5ySoMy7BwdzN70drLtafCJQncfAHXV
# O5r6SX4U/2J2zvWhA8lqhZu9SRulFGRvf81VTf+k5rJ2TjL6dYtSchooJ5YVvUk6
# i7bfV0VBN8xpaUhk8jbBnxhDPKIvDvnZlhPuJjCCBgAwggPooAMCAQICEzMAAADD
# Dpun2LLc9ywAAAAAAMMwDQYJKoZIhvcNAQELBQAwfjELMAkGA1UEBhMCVVMxEzAR
# BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1p
# Y3Jvc29mdCBDb3Jwb3JhdGlvbjEoMCYGA1UEAxMfTWljcm9zb2Z0IENvZGUgU2ln
# bmluZyBQQ0EgMjAxMTAeFw0xNzA4MTEyMDIwMjRaFw0xODA4MTEyMDIwMjRaMHQx
# CzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRt
# b25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xHjAcBgNVBAMTFU1p
# Y3Jvc29mdCBDb3Jwb3JhdGlvbjCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoC
# ggEBALtX1zjRsQZ/SS2pbbNjn3q6tjohW7SYro3UpIGgxXXFLO+CQCq3gVN382MB
# CrzON4QDQENXgkvO7R+2/YBtycKRXQXH3FZZAOEM61fe/fG4kCe/dUr8dbJyWLbF
# SJszYgXRlZSlvzkirY0STUZi2jIZzqoiXFZIsW9FyWd2Yl0wiKMvKMUfUCrZhtsa
# ESWBwvT1Zy7neR314hx19E7Mx/znvwuARyn/z81psQwLYOtn5oQbm039bUc6x9nB
# YWHylRKhDQeuYyHY9Jkc/3hVge6leegggl8K2rVTGVQBVw2HkY3CfPFUhoDhYtuC
# cz4mXvBAEtI51SYDDYWIMV8KC4sCAwEAAaOCAX8wggF7MB8GA1UdJQQYMBYGCisG
# AQQBgjdMCAEGCCsGAQUFBwMDMB0GA1UdDgQWBBSnE10fIYlV6APunhc26vJUiDUZ
# rzBRBgNVHREESjBIpEYwRDEMMAoGA1UECxMDQU9DMTQwMgYDVQQFEysyMzAwMTIr
# YzgwNGI1ZWEtNDliNC00MjM4LTgzNjItZDg1MWZhMjI1NGZjMB8GA1UdIwQYMBaA
# FEhuZOVQBdOCqhc3NyK1bajKdQKVMFQGA1UdHwRNMEswSaBHoEWGQ2h0dHA6Ly93
# d3cubWljcm9zb2Z0LmNvbS9wa2lvcHMvY3JsL01pY0NvZFNpZ1BDQTIwMTFfMjAx
# MS0wNy0wOC5jcmwwYQYIKwYBBQUHAQEEVTBTMFEGCCsGAQUFBzAChkVodHRwOi8v
# d3d3Lm1pY3Jvc29mdC5jb20vcGtpb3BzL2NlcnRzL01pY0NvZFNpZ1BDQTIwMTFf
# MjAxMS0wNy0wOC5jcnQwDAYDVR0TAQH/BAIwADANBgkqhkiG9w0BAQsFAAOCAgEA
# TZdPNH7xcJOc49UaS5wRfmsmxKUk9N9E1CS6s2oIiZmayzHncJv/FB2wBzl/5DA7
# EyLeDsiVZ7tufvh8laSQgjeTpoPTSQLBrK1Z75G3p2YADqJMJdTc510HAsooNGU7
# OYOtlSqOyqDoCDoc/j57QEmUTY5UJQrlsccK7nE3xpteNvWnQkT7vIewDcA12SaH
# X/9n7yh094owBBGKZ8xLNWBqIefDjQeDXpurnXEfKSYJEdT1gtPSNgcpruiSbZB/
# AMmoW+7QBGX7oQ5XU8zymInznxWTyAbEY1JhAk9XSBz1+3USyrX59MJpX7uhnQ1p
# gyfrgz4dazHD7g7xxIRDh+4xnAYAMny3IIq5CCPqVrAY1LK9Few37WTTaxUCI8aK
# M4c60Zu2wJZZLKABU4QBX/J7wXqw7NTYUvZfdYFEWRY4J1O7UPNecd/311HcMdUa
# YzUql36fZjdfz1Uz77LKvCwjqkQe7vtnSLToQsMPilFYokYCYSZaGb9clOmoQHDn
# WzBMfIDUUGeipe4O6z218eV5HuH1WBlvu4lteOIgWCX/5Eiz5q/xskAEF0ZQ1Axs
# kRR97sri9ibeGzsEZ1EuD6QX90L/P5GJMfinvLPlOlLcKjN/SmSRZdhlEbbbare0
# bFL8v4txFsQsznOaoOldCMFFRaUphuwBMW1edMZWMQswggYHMIID76ADAgECAgph
# Fmg0AAAAAAAcMA0GCSqGSIb3DQEBBQUAMF8xEzARBgoJkiaJk/IsZAEZFgNjb20x
# GTAXBgoJkiaJk/IsZAEZFgltaWNyb3NvZnQxLTArBgNVBAMTJE1pY3Jvc29mdCBS
# b290IENlcnRpZmljYXRlIEF1dGhvcml0eTAeFw0wNzA0MDMxMjUzMDlaFw0yMTA0
# MDMxMzAzMDlaMHcxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAw
# DgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24x
# ITAfBgNVBAMTGE1pY3Jvc29mdCBUaW1lLVN0YW1wIFBDQTCCASIwDQYJKoZIhvcN
# AQEBBQADggEPADCCAQoCggEBAJ+hbLHf20iSKnxrLhnhveLjxZlRI1Ctzt0YTiQP
# 7tGn0UytdDAgEesH1VSVFUmUG0KSrphcMCbaAGvoe73siQcP9w4EmPCJzB/LMySH
# nfL0Zxws/HvniB3q506jocEjU8qN+kXPCdBer9CwQgSi+aZsk2fXKNxGU7CG0OUo
# Ri4nrIZPVVIM5AMs+2qQkDBuh/NZMJ36ftaXs+ghl3740hPzCLdTbVK0RZCfSABK
# R2YRJylmqJfk0waBSqL5hKcRRxQJgp+E7VV4/gGaHVAIhQAQMEbtt94jRrvELVSf
# rx54QTF3zJvfO4OToWECtR0Nsfz3m7IBziJLVP/5BcPCIAsCAwEAAaOCAaswggGn
# MA8GA1UdEwEB/wQFMAMBAf8wHQYDVR0OBBYEFCM0+NlSRnAK7UD7dvuzK7DDNbMP
# MAsGA1UdDwQEAwIBhjAQBgkrBgEEAYI3FQEEAwIBADCBmAYDVR0jBIGQMIGNgBQO
# rIJgQFYnl+UlE/wq4QpTlVnkpKFjpGEwXzETMBEGCgmSJomT8ixkARkWA2NvbTEZ
# MBcGCgmSJomT8ixkARkWCW1pY3Jvc29mdDEtMCsGA1UEAxMkTWljcm9zb2Z0IFJv
# b3QgQ2VydGlmaWNhdGUgQXV0aG9yaXR5ghB5rRahSqClrUxzWPQHEy5lMFAGA1Ud
# HwRJMEcwRaBDoEGGP2h0dHA6Ly9jcmwubWljcm9zb2Z0LmNvbS9wa2kvY3JsL3By
# b2R1Y3RzL21pY3Jvc29mdHJvb3RjZXJ0LmNybDBUBggrBgEFBQcBAQRIMEYwRAYI
# KwYBBQUHMAKGOGh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2kvY2VydHMvTWlj
# cm9zb2Z0Um9vdENlcnQuY3J0MBMGA1UdJQQMMAoGCCsGAQUFBwMIMA0GCSqGSIb3
# DQEBBQUAA4ICAQAQl4rDXANENt3ptK132855UU0BsS50cVttDBOrzr57j7gu1BKi
# jG1iuFcCy04gE1CZ3XpA4le7r1iaHOEdAYasu3jyi9DsOwHu4r6PCgXIjUji8FMV
# 3U+rkuTnjWrVgMHmlPIGL4UD6ZEqJCJw+/b85HiZLg33B+JwvBhOnY5rCnKVuKE5
# nGctxVEO6mJcPxaYiyA/4gcaMvnMMUp2MT0rcgvI6nA9/4UKE9/CCmGO8Ne4F+tO
# i3/FNSteo7/rvH0LQnvUU3Ih7jDKu3hlXFsBFwoUDtLaFJj1PLlmWLMtL+f5hYbM
# UVbonXCUbKw5TNT2eb+qGHpiKe+imyk0BncaYsk9Hm0fgvALxyy7z0Oz5fnsfbXj
# pKh0NbhOxXEjEiZ2CzxSjHFaRkMUvLOzsE1nyJ9C/4B5IYCeFTBm6EISXhrIniIh
# 0EPpK+m79EjMLNTYMoBMJipIJF9a6lbvpt6Znco6b72BJ3QGEe52Ib+bgsEnVLax
# aj2JoXZhtG6hE6a/qkfwEm/9ijJssv7fUciMI8lmvZ0dhxJkAj0tr1mPuOQh5bWw
# ymO0eFQF1EEuUKyUsKV4q7OglnUa2ZKHE3UiLzKoCG6gW4wlv6DvhMoh1useT8ma
# 7kng9wFlb4kLfchpyOZu6qeXzjEp/w7FW1zYTRuh2Povnj8uVRZryROj/TCCB3ow
# ggVioAMCAQICCmEOkNIAAAAAAAMwDQYJKoZIhvcNAQELBQAwgYgxCzAJBgNVBAYT
# AlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYD
# VQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xMjAwBgNVBAMTKU1pY3Jvc29mdCBS
# b290IENlcnRpZmljYXRlIEF1dGhvcml0eSAyMDExMB4XDTExMDcwODIwNTkwOVoX
# DTI2MDcwODIxMDkwOVowfjELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0
# b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3Jh
# dGlvbjEoMCYGA1UEAxMfTWljcm9zb2Z0IENvZGUgU2lnbmluZyBQQ0EgMjAxMTCC
# AiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAKvw+nIQHC6t2G6qghBNNLry
# tlghn0IbKmvpWlCquAY4GgRJun/DDB7dN2vGEtgL8DjCmQawyDnVARQxQtOJDXlk
# h36UYCRsr55JnOloXtLfm1OyCizDr9mpK656Ca/XllnKYBoF6WZ26DJSJhIv56sI
# UM+zRLdd2MQuA3WraPPLbfM6XKEW9Ea64DhkrG5kNXimoGMPLdNAk/jj3gcN1Vx5
# pUkp5w2+oBN3vpQ97/vjK1oQH01WKKJ6cuASOrdJXtjt7UORg9l7snuGG9k+sYxd
# 6IlPhBryoS9Z5JA7La4zWMW3Pv4y07MDPbGyr5I4ftKdgCz1TlaRITUlwzluZH9T
# upwPrRkjhMv0ugOGjfdf8NBSv4yUh7zAIXQlXxgotswnKDglmDlKNs98sZKuHCOn
# qWbsYR9q4ShJnV+I4iVd0yFLPlLEtVc/JAPw0XpbL9Uj43BdD1FGd7P4AOG8rAKC
# X9vAFbO9G9RVS+c5oQ/pI0m8GLhEfEXkwcNyeuBy5yTfv0aZxe/CHFfbg43sTUkw
# p6uO3+xbn6/83bBm4sGXgXvt1u1L50kppxMopqd9Z4DmimJ4X7IvhNdXnFy/dygo
# 8e1twyiPLI9AN0/B4YVEicQJTMXUpUMvdJX3bvh4IFgsE11glZo+TzOE2rCIF96e
# TvSWsLxGoGyY0uDWiIwLAgMBAAGjggHtMIIB6TAQBgkrBgEEAYI3FQEEAwIBADAd
# BgNVHQ4EFgQUSG5k5VAF04KqFzc3IrVtqMp1ApUwGQYJKwYBBAGCNxQCBAweCgBT
# AHUAYgBDAEEwCwYDVR0PBAQDAgGGMA8GA1UdEwEB/wQFMAMBAf8wHwYDVR0jBBgw
# FoAUci06AjGQQ7kUBU7h6qfHMdEjiTQwWgYDVR0fBFMwUTBPoE2gS4ZJaHR0cDov
# L2NybC5taWNyb3NvZnQuY29tL3BraS9jcmwvcHJvZHVjdHMvTWljUm9vQ2VyQXV0
# MjAxMV8yMDExXzAzXzIyLmNybDBeBggrBgEFBQcBAQRSMFAwTgYIKwYBBQUHMAKG
# Qmh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2kvY2VydHMvTWljUm9vQ2VyQXV0
# MjAxMV8yMDExXzAzXzIyLmNydDCBnwYDVR0gBIGXMIGUMIGRBgkrBgEEAYI3LgMw
# gYMwPwYIKwYBBQUHAgEWM2h0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2lvcHMv
# ZG9jcy9wcmltYXJ5Y3BzLmh0bTBABggrBgEFBQcCAjA0HjIgHQBMAGUAZwBhAGwA
# XwBwAG8AbABpAGMAeQBfAHMAdABhAHQAZQBtAGUAbgB0AC4gHTANBgkqhkiG9w0B
# AQsFAAOCAgEAZ/KGpZjgVHkaLtPYdGcimwuWEeFjkplCln3SeQyQwWVfLiw++MNy
# 0W2D/r4/6ArKO79HqaPzadtjvyI1pZddZYSQfYtGUFXYDJJ80hpLHPM8QotS0LD9
# a+M+By4pm+Y9G6XUtR13lDni6WTJRD14eiPzE32mkHSDjfTLJgJGKsKKELukqQUM
# m+1o+mgulaAqPyprWEljHwlpblqYluSD9MCP80Yr3vw70L01724lruWvJ+3Q3fMO
# r5kol5hNDj0L8giJ1h/DMhji8MUtzluetEk5CsYKwsatruWy2dsViFFFWDgycSca
# f7H0J/jeLDogaZiyWYlobm+nt3TDQAUGpgEqKD6CPxNNZgvAs0314Y9/HG8VfUWn
# duVAKmWjw11SYobDHWM2l4bf2vP48hahmifhzaWX0O5dY0HjWwechz4GdwbRBrF1
# HxS+YWG18NzGGwS+30HHDiju3mUv7Jf2oVyW2ADWoUa9WfOXpQlLSBCZgB/QACnF
# sZulP0V3HjXG0qKin3p6IvpIlR+r+0cjgPWe+L9rt0uX4ut1eBrs6jeZeRhL/9az
# I2h15q/6/IvrC4DqaTuv/DDtBEyO3991bWORPdGdVk5Pv4BXIqF4ETIheu9BCrE/
# +6jMpF3BoYibV3FWTkhFwELJm3ZbCoBIa/15n8G9bW1qyVJzEw16UM0xggSqMIIE
# pgIBATCBlTB+MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4G
# A1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSgw
# JgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBTaWduaW5nIFBDQSAyMDExAhMzAAAAww6b
# p9iy3PcsAAAAAADDMAkGBSsOAwIaBQCggb4wGQYJKoZIhvcNAQkDMQwGCisGAQQB
# gjcCAQQwHAYKKwYBBAGCNwIBCzEOMAwGCisGAQQBgjcCARUwIwYJKoZIhvcNAQkE
# MRYEFHfkYAIrz1+tgao2BKwH2nwNps52MF4GCisGAQQBgjcCAQwxUDBOoCaAJABN
# AGkAYwByAG8AcwBvAGYAdAAgAEwAZQBhAHIAbgBpAG4AZ6EkgCJodHRwczovL3d3
# dy5taWNyb3NvZnQuY29tLmxlYXJuaW5nMA0GCSqGSIb3DQEBAQUABIIBACmgEv1i
# 3b2bGFrPwupmdggvgOU7+52x3hlHWn+J/jiS5i/wARtR/joFFaGqHi9HAb+kU8Iq
# 346kSNnNO01XwX55n53FSn4r1MjD2xJxDT5Y2gDHSP1Nhzsh3QYfGDfm21p6vpmi
# ZwovqCYSJWOZ8tzw6C3rWbnggK8t75M6V7weuPZm5TnLfJDsWf/j03O206L7aKLh
# ix6FcrjJnqPijc2g1lCUXThv/NOXCxQgMytngL9hsKIzdZgqQZ/O5gHlnO8O23R7
# nfF11N1RCUhNWct7NOAMjIpZb0PkPjZFU4Y/KAp1s5WkawHE1q/dlbcNYKO3Xn73
# /CDcjmzYJJc/XsuhggIoMIICJAYJKoZIhvcNAQkGMYICFTCCAhECAQEwgY4wdzEL
# MAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
# bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEhMB8GA1UEAxMYTWlj
# cm9zb2Z0IFRpbWUtU3RhbXAgUENBAhMzAAAAwN4sPQeU5El5AAAAAADAMAkGBSsO
# AwIaBQCgXTAYBgkqhkiG9w0BCQMxCwYJKoZIhvcNAQcBMBwGCSqGSIb3DQEJBTEP
# Fw0xNzEyMjYwODI2MTFaMCMGCSqGSIb3DQEJBDEWBBQk4GeGVsEQGIbsV1iMz79Z
# 5rfGfjANBgkqhkiG9w0BAQUFAASCAQCpniQzrd0/7LjhxQGsIozkAZH9AaW8Zw5/
# cznzuPkfs/1Mz1PZhDJ1y6kY7YQZDxPxl7gh3p02V94daPuTcyIl5F3Tm5poTpT2
# UzgB0LwzMgH4ex+78UBw922OygmbM4LeU46cFQIRMimh723S9PcD+F3ia6ypGqpR
# G35tKcy/L3f1eidXV6z7W0cgSq8pNK+Ot9r2FApEWarGTInIK3manWllZS2DBGzL
# X7DA4AkP/rO1xqHKvzYCGkbwrvdfIz5pi383TiJT1EOgiUPlZxjrEhDv3QnMbam2
# Pp/aFexMidLSek7AnURVIVGz04+dTm5U9QBqEyhXBjN85EPBHK+6
# SIG # End signature block
