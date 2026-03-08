import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, Loader2, Sparkles, CheckCircle2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'

export default function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        // Simulate API call
        try {
            await new Promise(resolve => setTimeout(resolve, 1500))
            setIsSuccess(true)
        } catch (error) {
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] rounded-full bg-amber-400/10 blur-[120px]" />
                <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px]" />
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <Link to="/" className="flex items-center justify-center gap-2 mb-8 group">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-premium group-hover:shadow-premium-lg transition-all duration-300">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-3xl font-bold tracking-tight text-gray-900">
                        ShopVista<span className="text-primary">.</span>
                    </span>
                </Link>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Card className="card-premium border-0 shadow-2xl bg-white/80 backdrop-blur-xl">
                        <CardHeader className="space-y-3 pb-6 text-center">
                            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Mail className="w-6 h-6 text-primary" />
                            </div>
                            <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
                                Forgot password?
                            </CardTitle>
                            <CardDescription className="text-base text-gray-500 max-w-sm mx-auto">
                                No worries, we'll send you reset instructions.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-8 pb-8">
                            {!isSuccess ? (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="form-group">
                                        <label className="text-sm font-medium text-gray-700">Email address</label>
                                        <div className="mt-1 relative">
                                            <Input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                placeholder="Enter your email"
                                                icon={<Mail className="w-5 h-5" />}
                                                className="bg-gray-50/50 border-gray-200 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary h-12"
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full btn-premium h-12 text-[15px] font-semibold"
                                        disabled={isSubmitting || !email}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                Sending instructions...
                                            </>
                                        ) : (
                                            'Reset password'
                                        )}
                                    </Button>
                                </form>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-4"
                                >
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Check your email</h3>
                                    <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                                        We sent a password reset link to<br />
                                        <span className="font-medium text-gray-900">{email}</span>
                                    </p>
                                    <Button
                                        onClick={() => setIsSuccess(false)}
                                        variant="outline"
                                        className="w-full h-11 border-gray-200 text-gray-600 hover:bg-gray-50"
                                    >
                                        Didn't receive the email? Click to resend
                                    </Button>
                                </motion.div>
                            )}

                            <div className="mt-8 text-center">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to log in
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}

